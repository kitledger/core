package main

import (
	"log"
)

func ExecuteCommand(args []string) {
	switch args[0] {
	case "help":
		log.Println("Available commands: help, db:migrate, session:start, user:create_root")
	case "db:migrate":
		log.Println("Running database migrations...")
	case "session:start":
		log.Println("Starting a new session...")
	case "user:create_root":
		log.Println("Creating root user...")

	default:
		log.Println("Unknown command:", args[0])
	}
}
