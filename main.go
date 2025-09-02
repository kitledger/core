package main

import (
	"log"
	"os"
)

func main() {
	args := os.Args

	if len(args) <= 1 || args[1] == "serve" {
		log.Println("Starting server on :8080")
	} else {
		ExecuteCommand(args[1:])
	}
}
