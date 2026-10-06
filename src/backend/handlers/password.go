package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
)

// FUNGSI HELPER KIRIM EMAIL
func sendEmail(to string, resetLink string) error {
	// Baca konfigurasi dari Environment Variable (docker-compose.yml)
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPortStr := os.Getenv("SMTP_PORT")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	// Konversi port ke integer
	smtpPort, err := strconv.Atoi(smtpPortStr)
	if err != nil {
		smtpPort = 587 // Default port jika error
	}

	m := gomail.NewMessage()
	m.SetHeader("From", smtpEmail)
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Reset Password - Finance Tracker")

	// Isi Email dengan Format HTML agar tombolnya bagus
	htmlBody := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
			<h2 style="color: #2563EB;">Permintaan Reset Password</h2>
			<p>Halo,</p>
			<p>Kami menerima permintaan untuk mereset password akun Finance Tracker Anda.</p>
			<p>Klik tombol di bawah ini untuk membuat password baru:</p>
			<br>
			<a href="%s" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password Sekarang</a>
			<br><br>
			<p style="font-size: 12px; color: #666;">Link ini hanya berlaku selama 1 jam.</p>
			<p style="font-size: 12px; color: #666;">Jika Anda tidak merasa meminta reset password, abaikan saja email ini.</p>
		</div>
	`, resetLink)

	m.SetBody("text/html", htmlBody)

	// Proses pengiriman
	d := gomail.NewDialer(smtpHost, smtpPort, smtpEmail, smtpPassword)
	return d.DialAndSend(m)
}

// User Minta Reset Password (Input Email)
func ForgotPassword(c *gin.Context) {
	var input struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Format email salah"})
		return
	}

	// Pesan sama untuk email terdaftar / tidak (agar tidak bisa dipakai menebak email user)
	const genericMsg = "Jika email terdaftar, link reset telah dikirim ke email Anda."

	var user models.User
	if err := config.DB.Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(input.Email))).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": genericMsg})
		return
	}

	// Generate Token Random 32 Karakter
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token reset"})
		return
	}
	token := hex.EncodeToString(bytes)

	// Simpan Token ke Database (Expired 1 jam)
	user.ResetToken = token
	user.ResetTokenExpiry = time.Now().Add(time.Hour)
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses permintaan reset"})
		return
	}

	// Buat Link Reset dari FRONTEND_URL
	resetLink := fmt.Sprintf("%s/reset-password?token=%s", strings.TrimRight(os.Getenv("FRONTEND_URL"), "/"), token)

	// KIRIM EMAIL
	go func() {
		err := sendEmail(user.Email, resetLink)
		if err != nil {
			fmt.Println("❌ Gagal kirim email ke:", user.Email, "| Error:", err)
		} else {
			fmt.Println("✅ Email reset terkirim ke:", user.Email)
		}
	}()

	c.JSON(http.StatusOK, gin.H{"message": genericMsg})
}

// User Eksekusi Reset Password (Input Password Baru)
func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 8 karakter"})
		return
	}

	// Cari User berdasarkan Token & Cek Expired
	var user models.User
	if err := config.DB.Where("reset_token = ? AND reset_token_expiry > ?", input.Token, time.Now()).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token tidak valid atau sudah kadaluwarsa"})
		return
	}

	// Hash Password Baru
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password baru"})
		return
	}
	user.Password = string(hash)

	// Hapus Token agar tidak bisa dipakai lagi (One-time use)
	user.ResetToken = ""
	user.ResetTokenExpiry = time.Time{}
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan password baru"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah! Silakan login."})
}