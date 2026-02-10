package controllers

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5" // Pastikan pakai v5 agar sama dengan middleware
	"golang.org/x/crypto/bcrypt"
)

// REGISTER
func Register(c *gin.Context) {
	var body struct {
		Username string
		Password string
		Email    string
	}

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca body"})
		return
	}

	// Hash Password
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), 10)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal hash password"})
		return
	}

	// Buat User
	user := models.User{
		Username: body.Username, 
		Password: string(hash),
		Email:    body.Email, // Simpan Email
	}
	
	result := config.DB.Create(&user)

	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membuat user (Username/Email mungkin sudah ada)"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Berhasil registrasi!"})
}

// LOGIN
func Login(c *gin.Context) {
	var body struct {
		Username string
		Password string
	}

	if c.Bind(&body) != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Gagal membaca body"})
		return
	}

	// Cari User berdasarkan Username
	var user models.User
	config.DB.First(&user, "username = ?", body.Username)

	if user.ID == 0 {
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