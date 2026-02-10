package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5" // Pastikan pakai v5 agar sama dengan middleware
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// Konfigurasi OAuth
var googleOauthConfig *oauth2.Config
var oauthStateString = "random-string-rahasia"

func InitGoogleAuth() {
	googleOauthConfig = &oauth2.Config{
		RedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

func HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	url := googleOauthConfig.AuthCodeURL(oauthStateString)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

type GoogleUser struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
}

func HandleGoogleCallback(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.FormValue("state") != oauthStateString {
			http.Error(w, "State invalid", http.StatusBadRequest)
			return
		}

		code := r.FormValue("code")
		token, err := googleOauthConfig.Exchange(context.Background(), code)
		if err != nil {
			http.Error(w, "Gagal menukar token code", http.StatusInternalServerError)
			return
		}

		resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
		if err != nil {
			http.Error(w, "Gagal ambil data user", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		content, _ := ioutil.ReadAll(resp.Body)
		var googleUser GoogleUser
		json.Unmarshal(content, &googleUser)

		// DATABASE LOGIC
		var userID int
		var username string

		// Cek apakah user ada?
		err = db.QueryRow("SELECT id, username FROM users WHERE email = $1", googleUser.Email).Scan(&userID, &username)

		if err == sql.ErrNoRows {
			// User BARU: Buat user baru
			username = googleUser.Name
			err = db.QueryRow(
				"INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id",
				username, googleUser.Email, "GOOGLE_AUTH_USER", time.Now(), time.Now(),
			).Scan(&userID)
			
			if err != nil {
				http.Error(w, "Gagal register user baru: "+err.Error(), http.StatusInternalServerError)
				return
			}
		} else if err != nil {
			http.Error(w, "Database error", http.StatusInternalServerError)
			return
		}

		// GENERATE TOKEN
		jwtToken, err := GenerateJWT(userID, username)
		if err != nil {
			http.Error(w, "Gagal buat token", http.StatusInternalServerError)
			return
		}

		// Redirect ke Frontend
		frontendURL := fmt.Sprintf("%s?token=%s&username=%s", os.Getenv("FRONTEND_URL"), jwtToken, username)
		http.Redirect(w, r, frontendURL, http.StatusSeeOther)
	}
}

// FUNGSI GENERATE TOKEN
func GenerateJWT(userID int, username string) (string, error) {
	// Gunakan 'sub' untuk ID agar cocok dengan Middleware
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      userID,    // <--- Middleware baca ini sebagai ID
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})
	
	// Gunakan Secret Key dari ENV agar cocok dengan Middleware
	return token.SignedString([]byte(os.Getenv("JWT_SECRET"))) 
}