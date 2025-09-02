package main

import (
	"log"
	"os"
)

func main() {
	args := os.Args

	if len(args) <= 1 || args[1] == "serve" {
		config := GetConfig()
		log.Printf("Server configuration: %+v\n", config)
		log.Println("Starting server on :8080")
	} else {
		ExecuteCommand(args[1:])
	}
}
