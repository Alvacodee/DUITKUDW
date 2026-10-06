package controllers

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5" // Pastikan pakai v5 agar sama dengan middleware
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
	if len(body.Username) < 3 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username minimal 3 karakter"})
		return
	}
	if _, err := mail.ParseAddress(body.Email); err != nil || !strings.Contains(body.Email, "@") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format email tidak valid"})
		return
	}
	if len(body.Password) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 8 karakter"})
		return
	}

	// Hash Password
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hash password"})
		return
	}

	// Buat User
	user := models.User{
		Username: body.Username,
		Password: string(hash),
		Email:    body.Email,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membuat user (Username/Email mungkin sudah ada)"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil registrasi!"})
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

	// Cari User berdasarkan Username
	var user models.User
	if err := config.DB.First(&user, "username = ?", strings.TrimSpace(body.Username)).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username atau password salah"})
		return
	}

	// Cek Password
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(body.Password))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username atau password salah"})
		return
	}

	// GENERATE TOKEN
	// Kita harus pakai 'sub' untuk ID dan Secret dari ENV agar cocok dengan Middleware
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": user.ID, // Middleware baca ini sebagai ID
		"exp": time.Now().Add(time.Hour * 24 * 7).Unix(), // Expire 7 hari
	})

	// Sign token dengan Secret Key dari Docker Compose
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
		return
	}

	// Kirim balik token
	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"username": user.Username, // Kirim username buat frontend
	})
}