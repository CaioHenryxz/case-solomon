# Solomon Mini-Analytics Platform 🚀

Plataforma de analytics completa, do dado bruto à visualização, desenvolvida para o case técnico da Solomon.

## 🛠️ Tecnologias e Arquitetura
- **Frontend**: React (Vite) com Recharts.
- **Backend 1**: Flask (Python) - Responsável por Auth e Orquestração de Pipeline.
- **Backend 2**: Go - API de alta performance para consulta de dados agregados.
- **Pipeline**: Go - Ingestão eficiente de dados via CSV.
- **Banco de Dados**: PostgreSQL com separação de schemas (`raw_data` e `aggregated`).
- **Infraestrutura**: Docker & Docker Compose.

## ✨ Diferenciais Implementados
- **Segurança**: Autenticação via Token (Middleware) implementada tanto no Backend Python quanto no Go.
- **UX/UI**: Interface customizada "Emerald & Slate" com cards de métricas operacionais e financeiras.
- **Visualização Analítica**: Gráfico com **Eixos Y Duplos** para comparação precisa entre Receita (R$) e Volume de Pedidos.
- **Filtros Dinâmicos**: Filtragem por período e método de pagamento direto na API.

## 🚀 Como Executar
1. Certifique-se de ter o Docker instalado.
2. Na raiz do projeto, rode: `docker-compose up --build`
3. Acesse: `http://localhost:5173`
4. Login: `admin@admin.com` | Senha: `123`