package main

import (
	"log"

	"github.com/kitledger/kitledger/internal/domain/auth"
)

func ExecuteCommand(args []string) {
	switch args[0] {
	case "help":
		log.Println("Available commands: help, db:migrate, session:start, user:create_root")
	case "db:migrate":
		log.Println("Running database migrations...")
	case "session:start":
		log.Println(auth.StartSession())
	case "user:root":
		log.Println(auth.CreateRootUser())

	default:
		log.Println("Unknown command:", args[0])
	}
}
