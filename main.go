package main

import (
	"log"
	"os"
)

func main() {
	args := os.Args

	if len(args) <= 1 || args[1] == "serve" {
		_, err := GetConfig()
		if err != nil {
			log.Fatalf("Failed to get configuration: %v", err)
			panic(err)
		}
		log.Println("Starting server on :8080")
	} else {
		ExecuteCommand(args[1:])
	}
}
