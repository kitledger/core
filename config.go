package main

import (
	"os"
	"strings"
)

/**
* 1) Define types
 */
type AppConfig struct {
	Auth    *authConfig    `json:"auth"`
	Cache   *cacheConfig   `json:"cache"`
	Db      *dbConfig      `json:"db"`
	Server  *serverConfig  `json:"server"`
	Session *sessionConfig `json:"session"`
}

type authConfig struct {
	Secret       string   `json:"secret"`
	PastSecrets  []string `json:"pastSecrets"`
	JwtAlgorithm string   `json:"jwtAlgorithm"`
}

type cacheAddress struct {
	Host string `json:"host"`
	Port int    `json:"port"`
}

type cacheConfig struct {
	Addresses []cacheAddress `json:"addresses"`
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
func loadConfig() *AppConfig {

	/**
	* Auth config
	 */
	jwtAlgorithm := "HS256"
	authSecret := os.Getenv("KL_AUTH_SECRET")

	if authSecret == "" {
		panic("KL_AUTH_SECRET environment variable is required")
	}

	pastSecretsString := os.Getenv("KL_AUTH_PAST_SECRETS")
	var pastSecrets []string
	if pastSecretsString != "" {
		pastSecrets = strings.Split(pastSecretsString, ",")
	}

	/**
	* Cache config
	*/
	

}
