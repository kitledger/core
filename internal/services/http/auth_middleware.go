package http

import (
	"context"
	"fmt"
	"net/http"
	"strings"

	"github.com/kitledger/kitledger/internal/domain/auth"
)

// Define a custom context key to store the user ID.
type contextKey string

const userKey contextKey = "user"

// Auth is a middleware that authenticates requests using a JWT.
func Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		tokenString := parts[1]

		payload, err := auth.VerifyJwt(tokenString)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		var userId string
		switch payload.TokenType {
		case auth.TokenType(auth.ApiTokenType):
			// TODO
			// Placeholder: In a real app, this would get the user ID from your database based on the token's JTI.
			// For now, we'll assume the JTI *is* the user ID for simplicity.
			userId = payload.Jti
			fmt.Println("API Token Type - UserID:", userId)
		case auth.TokenType(auth.SessionTokenType):
			// TODO
			// Placeholder: This would get the user ID from your session store (e.g., Redis, database) using the session ID (JTI).
			userId = payload.Jti
			fmt.Println("Session Token Type - UserID:", userId)
		default:
			http.Error(w, "Invalid token type", http.StatusUnauthorized)
			return
		}

		// Store the user ID in the request context for downstream handlers.
		ctx := context.WithValue(r.Context(), userKey, userId)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// GetUserIDFromContext retrieves the user ID from the request context.
func GetUserIDFromContext(ctx context.Context) (string, bool) {
	userId, ok := ctx.Value(userKey).(string)
	return userId, ok
}
