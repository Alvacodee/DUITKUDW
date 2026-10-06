package controllers

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// Input dari frontend (dipisah dari model agar field seperti ID/UserID tidak bisa disusupi)
type transactionInput struct {
	Date        string `json:"date"`
	Description string `json:"description"`
	Amount      int    `json:"amount"`
	Category    string `json:"category"`
	Type        string `json:"type"`
}

// Ambil user dari context (diisi middleware RequireAuth) tanpa risiko panic
func currentUser(c *gin.Context) (models.User, bool) {
	userContext, exists := c.Get("user")
	if !exists {
		return models.User{}, false
	}
	user, ok := userContext.(models.User)
	return user, ok
}

// Bind & validasi input transaksi. Return pesan error jika tidak valid
func bindTransactionInput(c *gin.Context) (transactionInput, string) {
	var input transactionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		return input, "Format data transaksi tidak valid"
	}

	input.Description = strings.TrimSpace(input.Description)
	input.Category = strings.TrimSpace(input.Category)

	if input.Description == "" {
		return input, "Keterangan wajib diisi"
	}
	if input.Amount <= 0 {
		return input, "Nominal harus lebih dari 0"
	}
	if input.Type != "Pemasukan" && input.Type != "Pengeluaran" {
		return input, "Jenis transaksi harus Pemasukan atau Pengeluaran"
	}
	if input.Category == "" {
		input.Category = "Lainnya"
	}
	// Tanggal disimpan sebagai string YYYY-MM-DD agar urutan "date desc" benar
	if input.Date == "" {
		input.Date = time.Now().Format("2006-01-02")
	} else if _, err := time.Parse("2006-01-02", input.Date); err != nil {
		return input, "Format tanggal harus YYYY-MM-DD"
	}

	return input, ""
}

// GET ALL TRANSACTIONS
func GetTransactions(c *gin.Context) {
	loggedInUser, ok := currentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Urutkan berdasarkan Date DESC (Terbaru di atas), lalu waktu input
	var transactions []models.Transaction
	if err := config.DB.Where("user_id = ?", loggedInUser.ID).Order("date desc, created_at desc").Find(&transactions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

// CREATE TRANSACTION
func CreateTransaction(c *gin.Context) {
	loggedInUser, ok := currentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	input, errMsg := bindTransactionInput(c)
	if errMsg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	transaction := models.Transaction{
		UserID:      loggedInUser.ID,
		Date:        input.Date,
		Description: input.Description,
		Amount:      input.Amount,
		Category:    input.Category,
		Type:        input.Type,
	}

	if err := config.DB.Create(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

// UPDATE TRANSACTION
func UpdateTransaction(c *gin.Context) {
	loggedInUser, ok := currentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Cari Transaksi berdasarkan ID dan UserID (Supaya tidak edit punya orang lain)
	var transaction models.Transaction
	if err := config.DB.Where("id = ? AND user_id = ?", c.Param("id"), loggedInUser.ID).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	input, errMsg := bindTransactionInput(c)
	if errMsg != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": errMsg})
		return
	}

	transaction.Date = input.Date
	transaction.Description = input.Description
	transaction.Amount = input.Amount
	transaction.Category = input.Category
	transaction.Type = input.Type

	if err := config.DB.Save(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

// DELETE TRANSACTION
func DeleteTransaction(c *gin.Context) {
	loggedInUser, ok := currentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Pastikan yang dihapus adalah milik user yang login
	var transaction models.Transaction
	if err := config.DB.Where("id = ? AND user_id = ?", c.Param("id"), loggedInUser.ID).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	if err := config.DB.Delete(&transaction).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus transaksi"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": true})
}
