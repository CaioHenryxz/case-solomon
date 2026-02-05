from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import psycopg2

app = Flask(__name__)
CORS(app)

# Credenciais e Token consistentes com os outros serviços
USER_DATA = {"email": "admin@admin.com", "password": "123"}
SECRET_TOKEN = "meu-token-secreto-123"

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    if data.get("email") == USER_DATA["email"] and data.get("password") == USER_DATA["password"]:
        return jsonify({"token": SECRET_TOKEN}), 200
    return jsonify({"error": "Usuário ou senha inválidos"}), 401

@app.route('/sync', methods=['POST']) # Alterado para POST para maior segurança
def sync():
    # Validação de Token no Backend 1 (Requisito: endpoint autenticado para disparar pipeline)
    token = request.headers.get("Authorization")
    if token != SECRET_TOKEN:
        return jsonify({"error": "Não autorizado"}), 401

    try:
        # 1. Dispara o Pipeline em Go para popular o schema raw_data
        pipeline_res = requests.get("http://pipeline:8080/run", timeout=15)
        
        # 2. Executa a Transformação para popular o schema aggregated
        conn = psycopg2.connect("host=db dbname=analytics_db user=user password=password")
        cur = conn.cursor()
        
        # Garante a limpeza antes de re-popular (Idempotência)
        cur.execute("DELETE FROM aggregated.metrics;")
        
        # SQL de Transformação: Agrega dados brutos para consumo eficiente
        cur.execute("""
            INSERT INTO aggregated.metrics (date, status, payment_method, total_value, total_count)
            SELECT 
                DATE(created_at), 
                status, 
                payment_method, 
                SUM(value), 
                COUNT(order_id)
            FROM raw_data.orders
            GROUP BY DATE(created_at), status, payment_method;
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Pipeline e Transformação concluídos com sucesso!"}), 200
    except Exception as e:
        return jsonify({"error": f"Falha no processo: {str(e)}"}), 500

if __name__ == '__main__':
    # Mantido na porta 5001 conforme sua necessidade local
    app.run(host='0.0.0.0', port=5001)