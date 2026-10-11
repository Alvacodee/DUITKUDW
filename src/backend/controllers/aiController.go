package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"log"
	"net/http"
	"os/exec"
	"sync"

	"github.com/gin-gonic/gin"
)

// Struct response dari Python
type PythonResponse struct {
	Prediction float64 `json:"prediction"`
	Trend      string  `json:"trend"`
	Status     string  `json:"status"`
	Message    string  `json:"message"`
	ModelUsed  string  `json:"model_used"`
}

// Minimal jumlah transaksi pengeluaran agar prediksi bermakna
const minPredictTransactions = 2

// Batas proses Python yang boleh berjalan bersamaan (tiap proses memuat pandas/statsmodels).
// Dibuat saat request pertama karena ukurannya dari config yang dibaca di main().
var (
	predictSlots     chan struct{}
	predictSlotsOnce sync.Once
)

func slots() chan struct{} {
	predictSlotsOnce.Do(func() {
		predictSlots = make(chan struct{}, config.App.PredictMaxConcurrency)
	})
	return predictSlots
}

func PredictSpending(c *gin.Context) {
	loggedInUser, ok := currentUser(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": msgUnauthorized})
		return
	}

	// Data lama "expense" sudah dinormalisasi saat startup (config.migrateData)
	var transactions []models.Transaction
	err := config.DB.Where("user_id = ? AND type = ?", loggedInUser.ID, models.TypeExpense).Find(&transactions).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data transaksi"})
		return
	}

	if len(transactions) < minPredictTransactions {
		c.JSON(http.StatusOK, gin.H{
			"prediction": 0,
			"trend":      "flat",
			"status":     "not_enough_data",
			"message":    "AI butuh minimal 2 data pengeluaran untuk bekerja.",
		})
		return
	}

	jsonData, err := json.Marshal(transactions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses data JSON"})
		return
	}

	// Ambil slot eksekusi; tolak bila semua slot sedang dipakai agar server tidak kehabisan CPU/RAM
	select {
	case slots() <- struct{}{}:
		defer func() { <-slots() }()
	default:
		c.Header("Retry-After", "10")
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "AI sedang sibuk, coba lagi sebentar lagi"})
		return
	}

	// Batasi waktu eksekusi agar request tidak menggantung jika Python macet
	ctx, cancel := context.WithTimeout(c.Request.Context(), config.App.PredictTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, config.App.PythonBin, config.App.PredictScript)
	cmd.Stdin = bytes.NewReader(jsonData)
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		// Detail hanya ke log server, bukan ke klien
		log.Printf("❌ Error Python (%s %s): %v\n%s", config.App.PythonBin, config.App.PredictScript, err, stderr.String())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menjalankan AI"})
		return
	}

	var result PythonResponse
	if err := json.Unmarshal(out.Bytes(), &result); err != nil {
		log.Println("❌ Output AI bukan JSON valid:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Format output AI tidak valid"})
		return
	}

	// predict.py keluar dengan exit code 1 bila gagal, tetapi status tetap dicek untuk berjaga-jaga
	if result.Status == "error" {
		log.Println("❌ Error dari AI:", result.Message, stderr.String())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "AI gagal memproses data"})
		return
	}

	c.JSON(http.StatusOK, result)
}
