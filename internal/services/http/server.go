package http

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/kitledger/kitledger/internal/services/config"
)

func StartServer() {
	config, err := config.Get()
	if err != nil {
		log.Fatalf("Failed to get configuration: %v", err)
		return
	}
	router := chi.NewRouter()
	router.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, World!"))
	})

	port := config.Server.Port
	addr := fmt.Sprintf(":%d", port)

	log.Printf("Starting server on port %s", addr)
	if err := http.ListenAndServe(addr, router); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
