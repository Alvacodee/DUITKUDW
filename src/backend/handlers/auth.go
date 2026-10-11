package handlers

import (
	"finance-tracker-backend/auth"
	"finance-tracker-backend/config"
	"finance-tracker-backend/middleware"
	"finance-tracker-backend/models"
	"net/http"
	"net/mail"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// REGISTER
func Register(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	if c.ShouldBindJSON(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca body"})
		return
	}

	body.Username = strings.TrimSpace(body.Username)
	body.Email = strings.ToLower(strings.TrimSpace(body.Email))

	// Validasi input (email wajib: dipakai untuk reset password & kolomnya unique)
	if msg := auth.ValidateUsername(body.Username); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}
	if _, err := mail.ParseAddress(body.Email); err != nil || !strings.Contains(body.Email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format email tidak valid"})
		return
	}
	if msg := auth.ValidatePassword(body.Password); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// Hash Password
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hash password"})
		return
	}

	// Buat User (email belum terverifikasi sampai link verifikasi diklik)
	user := models.User{
		Username: body.Username,
		Password: string(hash),
		Email:    body.Email,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membuat user (Username/Email mungkin sudah ada)"})
		return
	}

	// Kirim email verifikasi. Kegagalan kirim tidak membatalkan registrasi.
	SendVerificationEmail(user)

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil registrasi! Cek email untuk verifikasi alamat email."})
}

// LOGIN
func Login(c *gin.Context) {
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if c.ShouldBindJSON(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca body"})
		return
	}
	username := strings.TrimSpace(body.Username)

	// Batasi percobaan per akun (selain per IP di router) melawan brute force terdistribusi
	if ok, retry := middleware.LoginAccountLimiter.Allow(middleware.AccountKey(username)); !ok {
		middleware.TooManyRequests(c, retry)
		return
	}

	// Cari User berdasarkan Username
	var user models.User
	if err := config.DB.First(&user, "username = ?", username).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username atau password salah"})
		return
	}

	// Cek Password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username atau password salah"})
		return
	}

	tokenString, err := auth.IssueToken(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token":    tokenString,
		"username": user.Username,
	})
}
