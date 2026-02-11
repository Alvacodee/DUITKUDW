package handlers

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math/rand"
	"net/http"
	"os"
	"strings"
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
			http.Error(w, "Proses otentikasi tidak valid (State invalid).", http.StatusBadRequest)
			return
		}

		code := r.FormValue("code")
		token, err := googleOauthConfig.Exchange(context.Background(), code)
		if err != nil {
			http.Error(w, "Gagal terhubung dengan server Google.", http.StatusInternalServerError)
			return
		}

		resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + token.AccessToken)
		if err != nil {
			http.Error(w, "Gagal mengambil profil akun Google Anda.", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		content, _ := ioutil.ReadAll(resp.Body)
		var googleUser GoogleUser
		json.Unmarshal(content, &googleUser)

		// DATABASE LOGIC
		var userID int
		var username string

		// Cek apakah user sudah terdaftar?
		err = db.QueryRow("SELECT id, username FROM users WHERE email = $1", googleUser.Email).Scan(&userID, &username)

		if err == sql.ErrNoRows {
			// USER BARU: Buat username unik
			// 1. Ambil nama dari Google, hapus spasi, jadikan huruf kecil (contoh: "John Doe" -> "johndoe")
			baseUsername := strings.ToLower(strings.ReplaceAll(googleUser.Name, " ", ""))
			
			// 2. Tambahkan 4 angka acak di belakangnya untuk menjamin keunikannya
			rand.Seed(time.Now().UnixNano())
			randomNum := rand.Intn(9000) + 1000 // Menghasilkan angka antara 1000 - 9999
			username = fmt.Sprintf("%s_%d", baseUsername, randomNum)

			// 3. Masukkan ke database
			err = db.QueryRow(
				"INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id",
				username, googleUser.Email, "GOOGLE_AUTH_USER", time.Now(), time.Now(),
			).Scan(&userID)

			if err != nil {
				// ERROR HANDLING BERSIH: Tidak memunculkan kode SQL ke user
				fmt.Println("Error insert database:", err.Error()) // Hanya muncul di log server Koyeb
				http.Error(w, "Terjadi kesalahan pada sistem saat mendaftarkan akun Anda. Silakan coba lagi nanti.", http.StatusInternalServerError)
				return
			}
		} else if err != nil {
			fmt.Println("Error cek email:", err.Error())
			http.Error(w, "Terjadi kesalahan saat memeriksa data akun Anda.", http.StatusInternalServerError)
			return
		}

		// GENERATE TOKEN
		jwtToken, err := GenerateJWT(userID, username)
		if err != nil {
			http.Error(w, "Gagal membuat sesi login.", http.StatusInternalServerError)
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