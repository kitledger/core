package http

import (
	"fmt"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"

	"github.com/kitledger/kitledger/internal/services/config"
)

func StartServer() {
	// Get configuration
	config, err := config.Get()
	if err != nil {
		log.Fatalf("Failed to get configuration: %v", err)
		return
	}

	// Set up main router
	mainRouter := chi.NewRouter()

	// Prepare the API v1 router
	apiV1Router := GetApiV1Router()

	// Declare routes
	mainRouter.Get("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Hello, World!"))
	})

	// Mount the API v1 router
	mainRouter.Mount(ApiV1Prefix, apiV1Router)

	// Start the server
	port := config.Server.Port
	addr := fmt.Sprintf(":%d", port)

	log.Printf("Starting server on port %s", addr)
	if err := http.ListenAndServe(addr, mainRouter); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
