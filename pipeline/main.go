package main

import (
	"encoding/json"
	"database/sql"
	"fmt"
	"net/http"
	_ "github.com/lib/pq"
)

type Order struct {
	ID            string  `json:"order_id"`
	CreatedAt     string  `json:"created_at"`
	Status        string  `json:"status"`
	Value         float64 `json:"value"`
	PaymentMethod string  `json:"payment_method"`
}

func runPipeline(w http.ResponseWriter, r *http.Request) {
	db, _ := sql.Open("postgres", "host=db user=user password=password dbname=analytics_db sslmode=disable")
	defer db.Close()

	resp, err := http.Get("http://source-api:5000/orders")
	if err != nil {
		http.Error(w, "Erro ao buscar dados", 500)
		return
	}
	defer resp.Body.Close()

	var orders []Order
	json.NewDecoder(resp.Body).Decode(&orders)

	for _, o := range orders {
		query := `INSERT INTO raw_data.orders (order_id, created_at, status, value, payment_method) 
                  VALUES ($1, $2, $3, $4, $5) ON CONFLICT (order_id) DO NOTHING`
		db.Exec(query, o.ID, o.CreatedAt, o.Status, o.Value, o.PaymentMethod)
	}

	fmt.Fprintf(w, "Sincronização concluída com sucesso!")
	fmt.Println("✅ Pipeline executado via comando externo.")
}

func main() {
	http.HandleFunc("/run", runPipeline)
	fmt.Println("🚀 Robô de Pipeline aguardando ordens na porta 8080...")
	http.ListenAndServe(":8080", nil)
}