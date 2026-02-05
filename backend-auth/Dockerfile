FROM python:3.9-slim

WORKDIR /app

# Copia a lista de ferramentas e instala
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copia o código do app.py
COPY . .

# Manda o Python rodar o servidor na porta 5001
CMD ["python", "app.py"]