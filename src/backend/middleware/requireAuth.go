package middleware

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(c *gin.Context) {
	// Ambil token dari Header, hapus awalan "Bearer " jika ada
	tokenString := strings.TrimSpace(strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer "))

	if tokenString == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Dilarang masuk! Token tidak ditemukan."})
		return
	}

	// Validasi Token dengan Secret Key dari ENV.
	// WithExpirationRequired: token tanpa "exp" ditolak (library sudah cek expired otomatis)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode sign tidak valid")
		}
		return []byte(os.Getenv("JWT_SECRET")), nil
	}, jwt.WithExpirationRequired())

	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sudah expired"})
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token error"})
		return
	}

	// "sub" berisi ID user (angka JSON -> float64). Cek tipenya agar tidak panic
	sub, ok := claims["sub"].(float64)
	if !ok || sub <= 0 {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
		return
	}

	// Cari user di DB
	var user models.User
	if err := config.DB.First(&user, uint(sub)).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan!"})
		return
	}

	// Simpan user ke context
	c.Set("user", user)
	c.Next()
}
