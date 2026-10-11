package config

import (
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// AppConfig berisi konfigurasi aplikasi yang dibaca sekali saat startup dari environment.
type AppConfig struct {
	Production  bool   // GIN_MODE=release
	Port        string // PORT (default 8080)
	FrontendURL string // FRONTEND_URL, tanpa "/" di akhir

	// TRUSTED_PROXIES: daftar IP/CIDR proxy yang boleh mengisi X-Forwarded-For (dipisah koma).
	// Kosong = percaya semua proxy (perilaku default Gin); "none" = tidak percaya proxy mana pun.
	TrustedProxies []string

	PythonBin             string        // PYTHON_BIN (default: .venv di samping script, lalu python3/python)
	PredictScript         string        // ML_SCRIPT (default: ml/predict.py relatif ke direktori kerja / executable)
	PredictTimeout        time.Duration // PREDICT_TIMEOUT_SECONDS (default 60)
	PredictMaxConcurrency int           // PREDICT_MAX_CONCURRENCY (default 2)
}

var App AppConfig

const devFrontendURL = "http://localhost:5173"

// Load membaca environment ke config.App. Di mode production, FRONTEND_URL wajib diisi
// (dipakai untuk CORS, redirect login Google, dan link di email).
func Load() {
	App = AppConfig{
		Production:            os.Getenv("GIN_MODE") == gin.ReleaseMode,
		Port:                  getEnv("PORT", "8080"),
		FrontendURL:           strings.TrimRight(os.Getenv("FRONTEND_URL"), "/"),
		TrustedProxies:        splitList(os.Getenv("TRUSTED_PROXIES")),
		PredictTimeout:        time.Duration(getEnvInt("PREDICT_TIMEOUT_SECONDS", 60)) * time.Second,
		PredictMaxConcurrency: getEnvInt("PREDICT_MAX_CONCURRENCY", 2),
	}

	if App.FrontendURL == "" {
		if App.Production {
			log.Fatal("❌ FRONTEND_URL wajib di-set di production (CORS, redirect login, link email)")
		}
		App.FrontendURL = devFrontendURL
		log.Printf("⚠️  FRONTEND_URL kosong, memakai default development %s", devFrontendURL)
	}

	App.PredictScript = getEnv("ML_SCRIPT", findPredictScript())
	App.PythonBin = getEnv("PYTHON_BIN", findPython(filepath.Dir(filepath.Dir(App.PredictScript))))
}

// Cari ml/predict.py di direktori kerja dulu, lalu di samping executable
// (agar backend tetap jalan walau dijalankan dari direktori lain).
func findPredictScript() string {
	candidates := []string{}
	if cwd, err := os.Getwd(); err == nil {
		candidates = append(candidates, filepath.Join(cwd, "ml", "predict.py"))
	}
	if exe, err := os.Executable(); err == nil {
		candidates = append(candidates, filepath.Join(filepath.Dir(exe), "ml", "predict.py"))
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	if len(candidates) > 0 {
		return candidates[0]
	}
	return filepath.Join("ml", "predict.py")
}

// Python dari virtualenv proyek (dibuat `uv sync`) bila ada, selain itu python sistem.
func findPython(projectDir string) string {
	venv := filepath.Join(projectDir, ".venv", "bin", "python")
	fallback := "python3"
	if runtime.GOOS == "windows" {
		venv = filepath.Join(projectDir, ".venv", "Scripts", "python.exe")
		fallback = "python"
	}
	if _, err := os.Stat(venv); err == nil {
		return venv
	}
	return fallback
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if n, err := strconv.Atoi(os.Getenv(key)); err == nil && n > 0 {
		return n
	}
	return fallback
}

func splitList(s string) []string {
	var out []string
	for _, part := range strings.Split(s, ",") {
		if p := strings.TrimSpace(part); p != "" {
			out = append(out, p)
		}
	}
	return out
}
