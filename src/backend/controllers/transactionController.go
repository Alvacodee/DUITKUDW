package controllers

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"net/http"
	"github.com/gin-gonic/gin"
)

// GET ALL TRANSACTIONS
func GetTransactions(c *gin.Context) {
	// Ambil User dari Context (Middleware)
	userContext, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	loggedInUser := userContext.(models.User)

	// Query Database
	var transactions []models.Transaction
	
	// Kita urutkan berdasarkan Date DESC (Terbaru di atas)
	// Jika Date sama, urutkan berdasarkan waktu input (CreatedAt)
	config.DB.Where("user_id = ?", loggedInUser.ID).Order("date desc, created_at desc").Find(&transactions)

	c.JSON(http.StatusOK, gin.H{"data": transactions})
}

// CREATE TRANSACTION
func CreateTransaction(c *gin.Context) {
	// Ambil User
	userContext, _ := c.Get("user")
	loggedInUser := userContext.(models.User)

	// Validasi Input JSON
	var input models.Transaction
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Masukkan Data ke Database
	transaction := models.Transaction{
		UserID:      loggedInUser.ID,
		Date:        input.Date,        // Simpan tanggal manual dari input front end
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
	userContext, _ := c.Get("user")
	loggedInUser := userContext.(models.User)

	// Cari Transaksi berdasarkan ID dan UserID (Supaya tidak edit punya orang lain)
	id := c.Param("id")
	var transaction models.Transaction

	if err := config.DB.Where("id = ? AND user_id = ?", id, loggedInUser.ID).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	// Ambil Data Baru
	var input models.Transaction
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update Field
	transaction.Date = input.Date
	transaction.Description = input.Description
	transaction.Amount = input.Amount
	transaction.Category = input.Category
	transaction.Type = input.Type

	config.DB.Save(&transaction)

	c.JSON(http.StatusOK, gin.H{"data": transaction})
}

// DELETE TRANSACTION
func DeleteTransaction(c *gin.Context) {
	userContext, _ := c.Get("user")
	loggedInUser := userContext.(models.User)

	id := c.Param("id")
	var transaction models.Transaction

	// Pastikan yang dihapus adalah milik user yang login
	if err := config.DB.Where("id = ? AND user_id = ?", id, loggedInUser.ID).First(&transaction).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Transaksi tidak ditemukan"})
		return
	}

	config.DB.Delete(&transaction)
	c.JSON(http.StatusOK, gin.H{"data": true})
}