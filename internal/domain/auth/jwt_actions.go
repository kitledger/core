package auth

import (
	"github.com/kitledger/kitledger/internal/services/config"

	"github.com/lestrrat-go/jwx/v3/jwa"
	"github.com/lestrrat-go/jwx/v3/jwt"
)

const (
	SessionTokenType string = "SESSION"
	ApiTokenType     string = "API"
)

func TokenType(t string) string {
	switch t {
	case SessionTokenType:
		return SessionTokenType
	case ApiTokenType:
		return ApiTokenType
	default:
		return ""
	}
}

type JWTPayload struct {
	Jti       string `json:"jti"`
	TokenType string `json:"token_type"`
}

func assembleApiJWTPayload(tokenId string) *JWTPayload {
	return &JWTPayload{
		Jti:       tokenId,
		TokenType: "API",
	}
}

func assembleSessionJWTPayload(tokenId string) *JWTPayload {
	return &JWTPayload{
		Jti:       tokenId,
		TokenType: "SESSION",
	}
}

func SignJwt(payload *JWTPayload) (string, error) {

	appConfig, err := config.Get()
	if err != nil {
		return "", err
	}
	currentSecret := appConfig.Auth.Secret

	token := jwt.New()
	token.Set("jti", payload.Jti)
	token.Set("token_type", payload.TokenType)
	signed, err := jwt.Sign(token, jwt.WithKey(jwa.HS256(), []byte(currentSecret)))
	if err != nil {
		return "", err
	}
	return string(signed), nil
}

func VerifyJwt(tokenString string) (*JWTPayload, error) {
	appConfig, err := config.Get()
	if err != nil {
		return nil, err
	}
	
	currentSecret := appConfig.Auth.Secret

	decoded, err := jwt.Parse([]byte(tokenString), jwt.WithKey(jwa.HS256(), []byte(currentSecret)))

	if err != nil {
		// Try past secrets
		for _, pastSecret := range appConfig.Auth.PastSecrets {
			decoded, err = jwt.Parse([]byte(tokenString), jwt.WithKey(jwa.HS256(), []byte(pastSecret)))
			if err == nil {
				break
			}
		}
		if err != nil {
			return nil, err
		}
	}

	jti := ""
	decoded.Get("jti", &jti)

	tokenType := ""
	decoded.Get("token_type", &tokenType)

	return &JWTPayload{
		Jti:       jti,
		TokenType: tokenType,
	}, nil
}
