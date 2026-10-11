package main

import (
	"finance-tracker-backend/auth"
	"finance-tracker-backend/config"
	"finance-tracker-backend/controllers"
	"finance-tracker-backend/handlers"
	"finance-tracker-backend/middleware"
	"log"
	"os" // <-- Tambahan untuk membaca Environment Variables
	"time"

	"github.com/gin-gonic/gin"
)

func main() {
	// JWT_SECRET wajib ada. Tanpa secret, token bisa dipalsukan siapa saja
	auth.CheckSecret()

	// Konek Database
	config.ConnectDatabase()

	// Init Google Auth Config
	handlers.InitGoogleAuth()

	// Setup Router
	r := gin.Default()

	// Middleware CORS
	r.Use(func(c *gin.Context) {
		// Ambil URL dari Koyeb (.env). Jika kosong, fallback ke localhost (untuk testing lokal)
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:5173"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", frontendURL)
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Rate limit per IP untuk endpoint publik yang sensitif
	loginLimit := middleware.LimitByIP(middleware.NewLimiter(20, time.Minute))
	registerLimit := middleware.LimitByIP(middleware.NewLimiter(10, time.Hour))
	resetLimit := middleware.LimitByIP(middleware.NewLimiter(10, 15*time.Minute))

	// ROUTING STANDAR
	r.POST("/register", registerLimit, controllers.Register)
	r.POST("/login", loginLimit, controllers.Login)
	r.POST("/forgot-password", resetLimit, handlers.ForgotPassword)
	r.POST("/reset-password", resetLimit, handlers.ResetPassword)
	r.POST("/verify-email", resetLimit, handlers.VerifyEmail)

	// Route Login: Redirect ke Google
	// gin.WrapF karena HandleGoogleLogin signature-nya (w, r)
	r.GET("/auth/google/login", gin.WrapF(handlers.HandleGoogleLogin))

	// Route Callback: Menerima data dari Google
	r.GET("/auth/google/callback", gin.WrapF(handlers.HandleGoogleCallback))

	// Tukar kode login sekali pakai (dari redirect Google) dengan JWT
	r.POST("/auth/google/exchange", loginLimit, handlers.ExchangeLoginCode)

	// PROTECTED ROUTES
	protected := r.Group("/")
	protected.Use(middleware.RequireAuth)
	{
		// Transaksi CRUD
		protected.GET("/transactions", controllers.GetTransactions)
		protected.POST("/transactions", controllers.CreateTransaction)
		protected.PUT("/transactions/:id", controllers.UpdateTransaction)
		protected.DELETE("/transactions/:id", controllers.DeleteTransaction)

		// AI Prediction
		// AI Prediction: maks 5 permintaan per user per menit (tiap request menjalankan Python)
		protected.GET("/predict", middleware.LimitByUser(middleware.NewLimiter(5, time.Minute)), controllers.PredictSpending)
	}

	// Jalankan Server (PORT dari env jika ada, default 8080)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Gagal menjalankan server:", err)
	}
}
