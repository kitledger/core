package http

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

const ApiV1Prefix = "/api/v1"

func GetApiV1Router() http.Handler {
	r := chi.NewRouter()

	r.Get("/", handleWelcome)
	r.Post("/accounts", handlePostAccounts)
	r.Post("/entity-models", handlePostEntityModels)
	r.Post("/ledgers", handlePostLedgers)
	r.Post("/transaction-models", handlePostTransactionModels)
	r.Post("/unit-models", handlePostUnitModels)

	return r
}

func handleWelcome(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Welcome to the Kitledger API!"))
}

func handlePostAccounts(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Account created"))
}

func handlePostEntityModels(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Entity model created"))
}

func handlePostLedgers(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Ledger created"))
}

func handlePostTransactionModels(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Transaction model created"))
}

func handlePostUnitModels(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Unit model created"))
}