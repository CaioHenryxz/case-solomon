FROM golang:1.21-alpine

WORKDIR /app

# Instala o git (necessário para o Go baixar pacotes)
RUN apk add --no-cache git

# 1. Copia TUDO da pasta pipeline para dentro do container primeiro
COPY . .

# 2. Agora sim, pede para o Go baixar as dependências baseando-se no main.go
RUN go mod tidy

# 3. Constrói o executável
RUN go build -o pipeline main.go

CMD ["./pipeline"]