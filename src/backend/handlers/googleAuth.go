package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/golang-jwt/jwt/v5" // Pastikan pakai v5 agar sama dengan middleware
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

// Konfigurasi OAuth
var googleOauthConfig *oauth2.Config

const oauthStateCookie = "oauthstate"

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
	// State acak per-login, disimpan di cookie untuk dicek saat callback (anti CSRF)
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		http.Error(w, "Gagal memulai login Google.", http.StatusInternalServerError)
		return
	}
	state := hex.EncodeToString(b)

	http.SetCookie(w, &http.Cookie{
		Name:     oauthStateCookie,
		Value:    state,
		Path:     "/",
		MaxAge:   600,
		HttpOnly: true,
		Secure:   r.TLS != nil || r.Header.Get("X-Forwarded-Proto") == "https",
		SameSite: http.SameSiteLaxMode,
	})

	authURL := googleOauthConfig.AuthCodeURL(state)
	http.Redirect(w, r, authURL, http.StatusTemporaryRedirect)
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
		cookie, err := r.Cookie(oauthStateCookie)
		if err != nil || cookie.Value == "" || r.FormValue("state") != cookie.Value {
			http.Error(w, "Proses otentikasi tidak valid (State invalid).", http.StatusBadRequest)
			return
		}
		// State sekali pakai
		http.SetCookie(w, &http.Cookie{Name: oauthStateCookie, Value: "", Path: "/", MaxAge: -1})

		code := r.FormValue("code")
		token, err := googleOauthConfig.Exchange(r.Context(), code)
		if err != nil {
			http.Error(w, "Gagal terhubung dengan server Google.", http.StatusInternalServerError)
			return
		}

		// Ambil profil memakai client OAuth (token dikirim lewat header, bukan query string)
		client := googleOauthConfig.Client(r.Context(), token)
		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			http.Error(w, "Gagal mengambil profil akun Google Anda.", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		var googleUser GoogleUser
		if resp.StatusCode != http.StatusOK || json.NewDecoder(resp.Body).Decode(&googleUser) != nil || googleUser.Email == "" {
			http.Error(w, "Gagal membaca profil akun Google Anda.", http.StatusInternalServerError)
			return
		}
		if !googleUser.VerifiedEmail {
			http.Error(w, "Email Google Anda belum terverifikasi.", http.StatusForbidden)
			return
		}
		email := strings.ToLower(googleUser.Email)

		// DATABASE LOGIC
		var userID int
		var username string

		// Cek apakah user sudah terdaftar? (abaikan user yang sudah di-soft delete)
		err = db.QueryRow("SELECT id, username FROM users WHERE email = $1 AND deleted_at IS NULL", email).Scan(&userID, &username)

		if err == sql.ErrNoRows {
			// USER BARU: Buat username unik dari nama Google + 4 angka acak.
			// Coba beberapa kali jika kebetulan username sudah dipakai.
			baseUsername := sanitizeUsername(googleUser.Name, email)
			for attempt := 0; attempt < 5; attempt++ {
				username = fmt.Sprintf("%s_%d", baseUsername, randomInt(1000, 9999))
				err = db.QueryRow(
					"INSERT INTO users (username, email, password, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id",
					username, email, "GOOGLE_AUTH_USER", time.Now(), time.Now(),
				).Scan(&userID)
				if err == nil || !strings.Contains(err.Error(), "username") {
					break
				}
			}

			if err != nil {
				// Tidak memunculkan kode SQL ke user, hanya ke log server
				fmt.Println("Error insert database:", err.Error())
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

		// Redirect ke Frontend (parameter di-escape agar karakter khusus tidak merusak URL)
		query := url.Values{}
		query.Set("token", jwtToken)
		query.Set("username", username)
		frontendURL := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/") + "/?" + query.Encode()
		http.Redirect(w, r, frontendURL, http.StatusSeeOther)
	}
}

// Ubah nama Google jadi username aman: huruf kecil, hanya huruf/angka ASCII.
// Fallback ke bagian depan email jika nama kosong / non-latin.
func sanitizeUsername(name, email string) string {
	clean := func(s string) string {
		var b strings.Builder
		for _, r := range strings.ToLower(s) {
			if r < unicode.MaxASCII && (unicode.IsLetter(r) || unicode.IsDigit(r)) {
				b.WriteRune(r)
			}
		}
		return b.String()
	}

	base := clean(name)
	if base == "" {
		base = clean(strings.Split(email, "@")[0])
	}
	if base == "" {
		base = "user"
	}
	if len(base) > 20 {
		base = base[:20]
	}
	return base
}

func randomInt(min, max int) int {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max-min+1)))
	if err != nil {
		return min
	}
	return min + int(n.Int64())
}

// FUNGSI GENERATE TOKEN
func GenerateJWT(userID int, username string) (string, error) {
	// Gunakan 'sub' untuk ID agar cocok dengan Middleware
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      userID, // <--- Middleware baca ini sebagai ID
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	// Gunakan Secret Key dari ENV agar cocok dengan Middleware
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}
