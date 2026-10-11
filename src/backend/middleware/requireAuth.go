package middleware

import (
	"finance-tracker-backend/auth"
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func RequireAuth(c *gin.Context) {
	// Ambil token dari Header, hapus awalan "Bearer " jika ada
	tokenString := strings.TrimSpace(strings.TrimPrefix(c.GetHeader("Authorization"), "Bearer "))

	if tokenString == "" {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Dilarang masuk! Token tidak ditemukan."})
		return
	}

	// Validasi tanda tangan, exp, dan sub
	userID, version, err := auth.ParseToken(tokenString)
	if err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau sudah expired"})
		return
	}

	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan!"})
		return
	}

	// Token diterbitkan sebelum password direset / sesi dicabut
	if version != user.TokenVersion {
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Sesi sudah berakhir, silakan login ulang"})
		return
	}

	// Simpan user ke context
	c.Set("user", user)
	c.Set("userID", user.ID)
	c.Next()
}
