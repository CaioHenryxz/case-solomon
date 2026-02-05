package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	_ "github.com/lib/pq"
)

type Metric struct {
	Date          string  `json:"date"`
	Status        string  `json:"status"`
	PaymentMethod string  `json:"payment_method"`
	TotalValue    float64 `json:"total_value"`
	TotalCount    int     `json:"total_count"`
}

// Middleware para verificar o token (Obrigatório pelo Case)
func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Libera o preflight do CORS
		if r.Method == "OPTIONS" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization")
			return
		}

		token := r.Header.Get("Authorization")
		if token != "meu-token-secreto-123" {
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte("Não autorizado"))
			return
		}
		next.ServeHTTP(w, r)
	}
}

func getMetrics(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Content-Type", "application/json")

	// Captura os filtros da URL (Requisito: Filtro por método e período)
	method := r.URL.Query().Get("method")
	startDate := r.URL.Query().Get("start")
	endDate := r.URL.Query().Get("end")

	db, err := sql.Open("postgres", "host=db user=user password=password dbname=analytics_db sslmode=disable")
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer db.Close()

	// Query dinâmica para suportar os filtros
	query := "SELECT date, status, payment_method, total_value, total_count FROM aggregated.metrics WHERE 1=1"
	var args []interface{}
	argID := 1

	if method != "" {
		query += fmt.Sprintf(" AND payment_method = $%d", argID)
		args = append(args, method)
		argID++
	}
	if startDate != "" && endDate != "" {
		query += fmt.Sprintf(" AND date BETWEEN $%d AND $%d", argID, argID+1)
		args = append(args, startDate, endDate)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	defer rows.Close()

	metrics := make([]Metric, 0) // Inicializa vazio para retornar [] e não null
	for rows.Next() {
		var m Metric
		rows.Scan(&m.Date, &m.Status, &m.PaymentMethod, &m.TotalValue, &m.TotalCount)
		metrics = append(metrics, m)
	}

	json.NewEncoder(w).Encode(metrics)
}

func main() {
	// Aplica o middleware na rota de métricas
	http.HandleFunc("/metrics", authMiddleware(getMetrics))
	
	fmt.Println("📊 Backend de Consulta ligado na porta 8081...")
	http.ListenAndServe(":8081", nil)
}