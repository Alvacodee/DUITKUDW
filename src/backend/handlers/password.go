package handlers

import (
	"finance-tracker-backend/auth"
	"finance-tracker-backend/config"
	"finance-tracker-backend/middleware"
	"finance-tracker-backend/models"
	"fmt"
	"html"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/gomail.v2"
	"gorm.io/gorm"
)

const (
	resetTokenTTL  = time.Hour
	verifyTokenTTL = 24 * time.Hour
)

// FUNGSI HELPER KIRIM EMAIL
func sendEmail(to, subject, htmlBody string) error {
	// Baca konfigurasi dari Environment Variable (docker-compose.yml)
	smtpHost := os.Getenv("SMTP_HOST")
	smtpEmail := os.Getenv("SMTP_EMAIL")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	// Konversi port ke integer
	smtpPort, err := strconv.Atoi(os.Getenv("SMTP_PORT"))
	if err != nil {
		smtpPort = 587 // Default port jika error
	}

	m := gomail.NewMessage()
	m.SetHeader("From", smtpEmail)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", htmlBody)

	d := gomail.NewDialer(smtpHost, smtpPort, smtpEmail, smtpPassword)
	return d.DialAndSend(m)
}

// Kirim email di background; hasilnya hanya dicatat di log server.
func sendEmailAsync(to, subject, htmlBody string) {
	go func() {
		if err := sendEmail(to, subject, htmlBody); err != nil {
			log.Printf("❌ Gagal kirim email ke %s: %v", to, err)
		} else {
			log.Printf("✅ Email terkirim ke %s", to)
		}
	}()
}

// Template email sederhana dengan satu tombol aksi
func actionEmailHTML(title, intro, buttonText, link, validity string) string {
	return fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
			<h2 style="color: #2563EB;">%s</h2>
			<p>Halo,</p>
			<p>%s</p>
			<br>
			<a href="%s" style="background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">%s</a>
			<br><br>
			<p style="font-size: 12px; color: #666;">%s</p>
			<p style="font-size: 12px; color: #666;">Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.</p>
		</div>
	`, html.EscapeString(title), html.EscapeString(intro), html.EscapeString(link), html.EscapeString(buttonText), html.EscapeString(validity))
}

func frontendURL(path string) string {
	return config.App.FrontendURL + path
}

// SendVerificationEmail membuat token verifikasi baru untuk user dan mengirim link-nya.
func SendVerificationEmail(user models.User) {
	if user.EmailVerified || user.Email == "" {
		return
	}
	token, err := auth.RandomToken(32)
	if err != nil {
		log.Println("❌ Gagal membuat token verifikasi:", err)
		return
	}
	err = config.DB.Model(&user).Updates(map[string]interface{}{
		"verify_token":        auth.HashToken(token),
		"verify_token_expiry": time.Now().Add(verifyTokenTTL),
	}).Error
	if err != nil {
		log.Println("❌ Gagal menyimpan token verifikasi:", err)
		return
	}

	link := frontendURL("/verify-email?token=" + token)
	sendEmailAsync(user.Email, "Verifikasi Email - DuitKuDW", actionEmailHTML(
		"Verifikasi Alamat Email",
		"Terima kasih telah mendaftar di DuitKuDW. Klik tombol di bawah untuk memverifikasi email Anda.",
		"Verifikasi Email", link, "Link ini berlaku selama 24 jam.",
	))
}

// POST /verify-email {"token": "..."}
func VerifyEmail(c *gin.Context) {
	var input struct {
		Token string `json:"token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token verifikasi tidak valid"})
		return
	}

	res := config.DB.Model(&models.User{}).
		Where("verify_token = ? AND verify_token_expiry > ?", auth.HashToken(input.Token), time.Now()).
		Updates(map[string]interface{}{
			"email_verified":      true,
			"verify_token":        "",
			"verify_token_expiry": time.Time{},
		})
	if res.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memverifikasi email"})
		return
	}
	if res.RowsAffected == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Link verifikasi tidak valid atau sudah kedaluwarsa"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Email berhasil diverifikasi!"})
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
	email := middleware.AccountKey(input.Email)

	// Batas per alamat email: lewati pengiriman diam-diam agar respons tetap seragam
	if ok, _ := middleware.ResetEmailLimiter.Allow(email); !ok {
		c.JSON(http.StatusOK, gin.H{"message": genericMsg})
		return
	}

	var user models.User
	if err := config.DB.Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"message": genericMsg})
		return
	}

	token, err := auth.RandomToken(32)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token reset"})
		return
	}

	// Simpan hash token (bukan token asli) ke Database, berlaku 1 jam
	err = config.DB.Model(&user).Updates(map[string]interface{}{
		"reset_token":        auth.HashToken(token),
		"reset_token_expiry": time.Now().Add(resetTokenTTL),
	}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses permintaan reset"})
		return
	}

	link := frontendURL("/reset-password?token=" + token)
	sendEmailAsync(user.Email, "Reset Password - DuitKuDW", actionEmailHTML(
		"Permintaan Reset Password",
		"Kami menerima permintaan untuk mereset password akun DuitKuDW Anda. Klik tombol di bawah ini untuk membuat password baru.",
		"Reset Password Sekarang", link, "Link ini hanya berlaku selama 1 jam.",
	))

	c.JSON(http.StatusOK, gin.H{"message": genericMsg})
}

// User Eksekusi Reset Password (Input Password Baru)
func ResetPassword(c *gin.Context) {
	var input struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Data reset password tidak lengkap"})
		return
	}
	if msg := auth.ValidatePassword(input.NewPassword); msg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": msg})
		return
	}

	// Cari User berdasarkan hash Token & Cek Expired
	var user models.User
	if err := config.DB.Where("reset_token = ? AND reset_token_expiry > ?", auth.HashToken(input.Token), time.Now()).First(&user).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token tidak valid atau sudah kedaluwarsa"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses password baru"})
		return
	}

	// Token sekali pakai dihapus; email terbukti milik user (link dikirim ke email tsb);
	// token_version dinaikkan agar semua sesi lama (mis. milik penyerang) berakhir.
	err = config.DB.Model(&user).Updates(map[string]interface{}{
		"password":           string(hash),
		"reset_token":        "",
		"reset_token_expiry": time.Time{},
		"email_verified":     true,
		"token_version":      gorm.Expr("token_version + 1"),
	}).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan password baru"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password berhasil diubah! Silakan login."})
}
