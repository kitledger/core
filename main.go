package main

import (
	"log"
	"os"

	"github.com/kitledger/kitledger/internal/services/config"
	"github.com/kitledger/kitledger/internal/services/http"
)

func main() {
	args := os.Args

	if len(args) <= 1 || args[1] == "serve" {
		_, err := config.Get()
		if err != nil {
			log.Fatalf("Failed to get configuration: %v", err)
			panic(err)
		}
			
		http.StartServer()
		
	} else {
		ExecuteCommand(args[1:])
	}
}
