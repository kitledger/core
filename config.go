package main

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"
	"sync"

	"github.com/joho/godotenv"
)

/**
* 1) Define types
 */
type AppConfig struct {
	Auth    *authConfig    `json:"auth"`
	Db      *dbConfig      `json:"db"`
	Server  *serverConfig  `json:"server"`
	Session *sessionConfig `json:"session"`
}

type authConfig struct {
	Secret       string   `json:"secret"`
	PastSecrets  []string `json:"pastSecrets"`
	JwtAlgorithm string   `json:"jwtAlgorithm"`
}

type corsConfig struct {
	Origin        []string `json:"origin"`
	AllowMethods  []string `json:"allowMethods,omitempty"`
	AllowHeaders  []string `json:"allowHeaders,omitempty"`
	MaxAge        *int     `json:"maxAge,omitempty"`
	Credentials   *bool    `json:"credentials,omitempty"`
	ExposeHeaders []string `json:"exposeHeaders,omitempty"`
}

type dbConfig struct {
	Url string `json:"url"`
	Ssl bool   `json:"ssl"`
	Max int    `json:"max"`
}

type serverConfig struct {
	Port int         `json:"port"`
	Cors *corsConfig `json:"cors"`
}

type sessionConfig struct {
	TtlMinutes int `json:"ttlMinutes"`
}

/**
* 2) Define the logic for complex values
 */

/**
* Authentication config
 */
func loadConfig() (*AppConfig, error) {

	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	/**
	* Auth config
	 */
	jwtAlgorithm := "HS256"
	authSecret := os.Getenv("KL_AUTH_SECRET")

	if authSecret == "" {
		return nil, errors.New("KL_AUTH_SECRET environment variable is required")
	}

	pastSecretsString := os.Getenv("KL_AUTH_PAST_SECRETS")
	var pastSecrets []string
	if pastSecretsString != "" {
		pastSecrets = strings.Split(pastSecretsString, ",")
	}

	/**
	* CORS config
	 */
	allHeaders := []string{"Content-Type", "Authorization", "X-Requested-With"}

	if envHeadersStr := os.Getenv("KL_CORS_ALLOWED_HEADERS"); envHeadersStr != "" {
		envHeaders := strings.Split(envHeadersStr, ",")
		allHeaders = append(allHeaders, envHeaders...)
	}

	headerMap := make(map[string]struct{})
	corsAllowedHeaders := []string{}

	for _, header := range allHeaders {
		trimmed := strings.TrimSpace(header)
		if trimmed != "" {
			if _, ok := headerMap[trimmed]; !ok {
				headerMap[trimmed] = struct{}{}
				corsAllowedHeaders = append(corsAllowedHeaders, trimmed)
			}
		}
	}

	corsAllowedMethods := []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}

	var corsAllowedOrigins []string

	if originsStr := os.Getenv("KL_CORS_ALLOWED_ORIGINS"); originsStr != "" {
		corsAllowedOrigins = strings.Split(originsStr, ",")
	} else {
		corsAllowedOrigins = []string{"*"}
	}

	corsCredentials := false
	corsExposeHeaders := []string{}

	var corsMaxAge int
	corsMaxAgeStr := os.Getenv("KL_CORS_MAX_AGE")
	corsMaxAgeValue, err := strconv.Atoi(corsMaxAgeStr)
	if err != nil {
		corsMaxAge = 86400
	} else {
		corsMaxAge = corsMaxAgeValue
	}

	/**
	* DB Config
	 */
	dbUrl := os.Getenv("KL_POSTGRES_URL")
	if dbUrl == "" {
		return nil, errors.New("KL_POSTGRES_URL environment variable is required")
	}

	dbSsl := os.Getenv("KL_POSTGRES_SSL") == "true"

	var dbMax int
	dbMaxStr := os.Getenv("KL_POSTGRES_MAX_CONNECTIONS")
	dbMaxValue, err := strconv.Atoi(dbMaxStr)
	if err != nil {
		dbMax = 10
	} else {
		dbMax = dbMaxValue
	}

	/**
	* Server config
	 */
	var serverPort int
	serverPortStr := os.Getenv("KL_SERVER_PORT")
	serverPortValue, err := strconv.Atoi(serverPortStr)
	if err != nil {
		serverPort = 8080
	} else {
		serverPort = serverPortValue
	}

	/**
	* Session config
	 */
	var sessionTtlMinutes int
	sessionTtlMinutesStr := os.Getenv("KL_SESSION_TTL_MINUTES")
	sessionTtlMinutesValue, err := strconv.Atoi(sessionTtlMinutesStr)
	if err != nil {
		sessionTtlMinutes = 60
	} else {
		sessionTtlMinutes = sessionTtlMinutesValue
	}

	appConfig := &AppConfig{
		Auth: &authConfig{
			Secret:       authSecret,
			PastSecrets:  pastSecrets,
			JwtAlgorithm: jwtAlgorithm,
		},
		Db: &dbConfig{
			Url: dbUrl,
			Ssl: dbSsl,
			Max: dbMax,
		},
		Server: &serverConfig{
			Port: serverPort,
			Cors: &corsConfig{
				Origin:        corsAllowedOrigins,
				AllowMethods:  corsAllowedMethods,
				AllowHeaders:  corsAllowedHeaders,
				MaxAge:        &corsMaxAge,
				Credentials:   &corsCredentials,
				ExposeHeaders: corsExposeHeaders,
			},
		},
		Session: &sessionConfig{
			TtlMinutes: sessionTtlMinutes,
		},
	}

	return appConfig, nil
}

var (
	config *AppConfig
	once   sync.Once
)

func GetConfig() (*AppConfig, error) {
	var configError error
	once.Do(func() {
		config, err := loadConfig()
		if err != nil {
			log.Fatalf("Error loading config: %v", err)
			configError = err
		}
		log.Printf("Configuration loaded: %+v\n", config)
	})
	return config, configError
}
