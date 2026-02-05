from flask import Flask, jsonify
import pandas as pd
import os

app = Flask(__name__)
CSV_PATH = '/data/orders.csv'

@app.route('/orders', methods=['GET'])
def get_orders():
    df = pd.read_csv(CSV_PATH, sep=';')
    df['value'] = df['value'].str.replace(',', '.').astype(float)
    data = df.to_dict(orient='records')
    return jsonify(data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)