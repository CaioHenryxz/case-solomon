package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	_ "github.com/lib/pq"
)

// Estrutura de resposta
type Metric struct {
	Date       string  `json:"date"`
	Status     string  `json:"status"`
	TotalValue float64 `json:"total_value"`
	TotalCount int     `json:"total_count"`
}

func getMetrics(w http.ResponseWriter, r *http.Request) {
	// 1. Configuração de CORS (Permite acesso do Frontend)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")

	if r.Method == "OPTIONS" {
		return
	}

	// 2. Conexão com o Banco
	db, err := sql.Open("postgres", "host=db user=user password=password dbname=analytics_db sslmode=disable")
	if err != nil {
		http.Error(w, "Erro conexão banco", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	// 3. Captura os filtros da URL
	method := r.URL.Query().Get("method")
	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")

	// 4. QUERY BLINDADA: Usa ::DATE para ignorar horas e minutos
	// Isso garante que o dia 20/01 às 14:00 seja somado junto com 20/01 às 09:00
	query := `
		SELECT 
			TO_CHAR(date::DATE, 'YYYY-MM-DD') as date_str, 
			status, 
			COALESCE(SUM(total_value), 0) as total_value, 
			COALESCE(SUM(total_count), 0) as total_count 
		FROM aggregated.metrics 
		WHERE 1=1
	`
	var args []interface{}
	counter := 1

	// Filtro de Método
	if method != "" {
		query += fmt.Sprintf(" AND payment_method = $%d", counter)
		args = append(args, method)
		counter++
	}

	// Filtro de Data Inicial (Ignora hora)
	if start != "" {
		query += fmt.Sprintf(" AND date::DATE >= $%d::DATE", counter)
		args = append(args, start)
		counter++
	}

	// Filtro de Data Final (Ignora hora -> Pega o dia inteiro até 23:59)
	if end != "" {
		query += fmt.Sprintf(" AND date::DATE <= $%d::DATE", counter)
		args = append(args, end)
		counter++
	}

	// Agrupa apenas pelo DIA e STATUS
	query += " GROUP BY date::DATE, status ORDER BY date::DATE ASC"

	rows, err := db.Query(query, args...)
	if err != nil {
		fmt.Println("Erro na query SQL:", err)
		http.Error(w, "Erro interno no servidor", http.StatusInternalServerError)
		return
	}
	defer rows.Close()
	
	var metrics []Metric
	for rows.Next() {
		var m Metric
		// Scan lê os dados já somados do banco
		if err := rows.Scan(&m.Date, &m.Status, &m.TotalValue, &m.TotalCount); err != nil {
			fmt.Println("Erro ao ler linha:", err)
			continue
		}
		metrics = append(metrics, m)
	}

	// Retorna lista vazia [] se não houver dados (evita null no front)
	if metrics == nil {
		metrics = []Metric{}
	}

	json.NewEncoder(w).Encode(metrics)
}

func main() {
	http.HandleFunc("/metrics", getMetrics)
	fmt.Println("🚀 Backend Solomon (Modo Seguro de Data) rodando na porta 8081...")
	http.ListenAndServe(":8081", nil)
}