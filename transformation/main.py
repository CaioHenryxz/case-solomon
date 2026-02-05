import psycopg2
import time

def transform():
    print("Iniciando a transformação de dados...")
    # Conecta ao banco
    conn = psycopg2.connect("host=db dbname=analytics_db user=user password=password")
    cur = conn.cursor()

    # 1. Limpa o que já existe para não duplicar
    cur.execute("DELETE FROM aggregated.metrics;")

    # 2. Faz a mágica do SQL: Agrupa por data, status e método de pagamento
    query = """
    INSERT INTO aggregated.metrics (date, status, payment_method, total_value, total_count)
    SELECT 
        DATE(created_at) as date,
        status,
        payment_method,
        SUM(value) as total_value,
        COUNT(order_id) as total_count
    FROM raw_data.orders
    GROUP BY DATE(created_at), status, payment_method;
    """
    
    cur.execute(query)
    conn.commit()
    print("✅ Transformação concluída com sucesso!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    # Espera um pouco para garantir que o banco está pronto
    time.sleep(15) 
    transform()