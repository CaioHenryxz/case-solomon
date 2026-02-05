CREATE SCHEMA IF NOT EXISTS raw_data;
CREATE SCHEMA IF NOT EXISTS aggregated;

-- Tabela de dados brutos
CREATE TABLE IF NOT EXISTS raw_data.orders (
    order_id VARCHAR(50) PRIMARY KEY,
    created_at TIMESTAMP,
    status VARCHAR(20),
    value NUMERIC(10,2),
    payment_method VARCHAR(20)
);

-- Tabela de relatórios (onde a transformação salva)
CREATE TABLE IF NOT EXISTS aggregated.metrics (
    date DATE,
    status VARCHAR(20),
    payment_method VARCHAR(20),
    total_value NUMERIC(15,2),
    total_count INT,
    PRIMARY KEY (date, status, payment_method)
);