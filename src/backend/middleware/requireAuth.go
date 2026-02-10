package middleware

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func RequireAuth(c *gin.Context) {
	// Ambil token dari Header
	tokenString := c.GetHeader("Authorization")

	// Hapus awalan "Bearer " jika ada (FIX FORMAT TOKEN)
	if strings.HasPrefix(tokenString, "Bearer ") {
		tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	}

	if tokenString == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Dilarang masuk! Token tidak ditemukan."})
		return
	}

	// Validasi Token dengan Secret Key dari ENV (FIX SECRET KEY)
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Metode sign tidak valid")
		}
		// Gunakan Env Variable agar sinkron dengan GoogleAuth
		return []byte(os.Getenv("JWT_SECRET")), nil 
	})

	if err != nil || !token.Valid {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
		return
	}

	// Ambil Data User (FIX CLAIMS)
	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		// Cek Expired
		if float64(time.Now().Unix()) > claims["exp"].(float64) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token expired!"})
			return
		}

		// Cari user di DB menggunakan "sub" (Subject/ID)
		var user models.User
		config.DB.First(&user, claims["sub"])

		if user.ID == 0 {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan!"})
			return
		}

		// Simpan user ke context
		c.Set("user", user)
		c.Next()
	} else {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token error"})
	}
}