package controllers

import (
	"bytes"
	"encoding/json"
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/gin-gonic/gin"
)

// Struct response dari Python
type PythonResponse struct {
	Prediction float64 `json:"prediction"`
	Trend      string  `json:"trend"`
	Status     string  `json:"status"`
	Message    string  `json:"message"`
}

func PredictSpending(c *gin.Context) {
	// AMBIL USER DARI CONTEXT (Sesuai Middleware)
	userContext, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: User data not found"})
		return
	}

	// TYPE ASSERTION
	loggedInUser, ok := userContext.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}

	userID := loggedInUser.ID // Ambil ID dari struct User

	// AMBIL DATA TRANSAKSI (Filter by UserID)
	var transactions []models.Transaction
	
	// Query: Ambil milik user tersebut DAN (tipe Pengeluaran ATAU expense)
	err := config.DB.Where("user_id = ? AND (type = ? OR type = ?)", userID, "Pengeluaran", "expense").Find(&transactions).Error
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data transaksi"})
		return
	}

	// Validasi jumlah data
	if len(transactions) < 2 {
		c.JSON(http.StatusOK, gin.H{
			"prediction": 0,
			"trend":      "flat",
			"status":     "not_enough_data",
			"message":    "AI butuh minimal 2 data pengeluaran untuk bekerja.",
		})
		return
	}

	// Marshal data ke JSON
	jsonData, err := json.Marshal(transactions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses data JSON"})
		return
	}

	// DETEKSI & JALANKAN PYTHON
	cwd, _ := os.Getwd()
	var pythonPath string
	
	// Cek path VENV
	if runtime.GOOS == "windows" {
		pythonPath = filepath.Join(cwd, ".venv", "Scripts", "python.exe")
	} else {
		pythonPath = filepath.Join(cwd, ".venv", "bin", "python")
	}

	// Fallback ke system python jika venv tidak ada
	if _, err := os.Stat(pythonPath); os.IsNotExist(err) {
		if runtime.GOOS == "windows" {
			pythonPath = "python"
		} else {
			pythonPath = "python3"
		}
	}

	scriptPath := filepath.Join(cwd, "ml", "predict.py") 
	
	cmd := exec.Command(pythonPath, scriptPath)
	cmd.Stdin = bytes.NewReader(jsonData)
	
	var out bytes.Buffer
	var stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err = cmd.Run()
	if err != nil {
		// Print error detail ke terminal backend untuk debugging
		fmt.Println("❌ Error Python:", stderr.String()) 
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":  "Gagal menjalankan AI",
			"detail": stderr.String(),
		})
		return
	}

	// PARSING OUTPUT
	var result PythonResponse
	if err := json.Unmarshal(out.Bytes(), &result); err != nil {
		fmt.Println("❌ Error Parsing JSON:", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Format output AI tidak valid",
			"raw":   out.String(),
		})
		return
	}

	c.JSON(http.StatusOK, result)
}