package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"fmt"
	"math/big"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5" // Pastikan pakai v5 agar sama dengan middleware
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm/clause"
)

// Konfigurasi OAuth
var googleOauthConfig *oauth2.Config

const oauthStateCookie = "oauthstate"

// Umur kode login sekali pakai yang dikirim ke frontend
const loginCodeTTL = 2 * time.Minute

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

// Redirect ke frontend dengan data di fragment URL (#...).
// Fragment tidak dikirim browser ke server mana pun, jadi tidak tercatat di access log.
func redirectToFrontend(w http.ResponseWriter, r *http.Request, fragment url.Values) {
	target := strings.TrimRight(os.Getenv("FRONTEND_URL"), "/") + "/#" + fragment.Encode()
	http.Redirect(w, r, target, http.StatusSeeOther)
}

func redirectLoginError(w http.ResponseWriter, r *http.Request, msg string) {
	redirectToFrontend(w, r, url.Values{"login_error": {msg}})
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
			redirectLoginError(w, r, "Gagal terhubung dengan server Google.")
			return
		}

		// Ambil profil memakai client OAuth (token dikirim lewat header, bukan query string)
		client := googleOauthConfig.Client(r.Context(), token)
		resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
		if err != nil {
			redirectLoginError(w, r, "Gagal mengambil profil akun Google Anda.")
			return
		}
		defer resp.Body.Close()

		var googleUser GoogleUser
		if resp.StatusCode != http.StatusOK || json.NewDecoder(resp.Body).Decode(&googleUser) != nil || googleUser.Email == "" {
			redirectLoginError(w, r, "Gagal membaca profil akun Google Anda.")
			return
		}
		if !googleUser.VerifiedEmail {
			redirectLoginError(w, r, "Email Google Anda belum terverifikasi.")
			return
		}
		email := strings.ToLower(googleUser.Email)

		// DATABASE LOGIC
		var userID int
		var username string

		// Cek apakah user sudah terdaftar? (case-insensitive, abaikan user yang sudah di-soft delete)
		err = db.QueryRow("SELECT id, username FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL", email).Scan(&userID, &username)

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
				redirectLoginError(w, r, "Terjadi kesalahan saat mendaftarkan akun Anda. Silakan coba lagi nanti.")
				return
			}
		} else if err != nil {
			fmt.Println("Error cek email:", err.Error())
			redirectLoginError(w, r, "Terjadi kesalahan saat memeriksa data akun Anda.")
			return
		}

		// Buat kode login sekali pakai; JWT baru diberikan saat frontend menukar kode ini
		loginCode, err := issueLoginCode(uint(userID))
		if err != nil {
			fmt.Println("Error membuat login code:", err.Error())
			redirectLoginError(w, r, "Gagal membuat sesi login.")
			return
		}

		redirectToFrontend(w, r, url.Values{"login_code": {loginCode}})
	}
}

func hashLoginCode(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

func issueLoginCode(userID uint) (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	code := hex.EncodeToString(b)

	// Bersihkan kode lama yang sudah kedaluwarsa (tabel tetap kecil)
	config.DB.Where("expires_at < ?", time.Now()).Delete(&models.LoginCode{})

	record := models.LoginCode{
		CodeHash:  hashLoginCode(code),
		UserID:    userID,
		ExpiresAt: time.Now().Add(loginCodeTTL),
	}
	if err := config.DB.Create(&record).Error; err != nil {
		return "", err
	}
	return code, nil
}

// POST /auth/google/exchange  {"code": "..."}  ->  {"token": "...", "username": "..."}
func ExchangeLoginCode(c *gin.Context) {
	var input struct {
		Code string `json:"code" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Kode login tidak valid"})
		return
	}

	// Hapus & ambil dalam satu query (DELETE ... RETURNING) agar kode benar-benar sekali pakai
	var record models.LoginCode
	res := config.DB.Clauses(clause.Returning{}).
		Where("code_hash = ? AND expires_at > ?", hashLoginCode(input.Code), time.Now()).
		Delete(&record)
	if res.Error != nil || res.RowsAffected != 1 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Kode login tidak valid atau sudah kedaluwarsa"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, record.UserID).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan"})
		return
	}

	jwtToken, err := GenerateJWT(int(user.ID), user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat sesi login"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": jwtToken, "username": user.Username})
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
