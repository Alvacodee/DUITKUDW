package main

import (
	"finance-tracker-backend/auth"
	"finance-tracker-backend/config"
	"finance-tracker-backend/controllers"
	"finance-tracker-backend/handlers"
	"finance-tracker-backend/middleware"
	"log"
	"time"
	_ "time/tzdata" // database zona waktu ikut di-embed (image runtime minimal mungkin tanpa tzdata)

	"github.com/gin-gonic/gin"
)

func main() {
	// Konfigurasi dari environment (FRONTEND_URL, PORT, TRUSTED_PROXIES, dll)
	config.Load()

	// JWT_SECRET wajib ada. Tanpa secret, token bisa dipalsukan siapa saja
	auth.CheckSecret()

	config.ConnectDatabase()
	handlers.InitGoogleAuth()

	r := gin.Default()
	configureTrustedProxies(r)
	r.Use(corsMiddleware(config.App.FrontendURL))
	r.Use(func(c *gin.Context) {
		// API hanya mengembalikan JSON; cegah browser menebak tipe konten
		c.Header("X-Content-Type-Options", "nosniff")
		c.Next()
	})

	// Rate limit per IP untuk endpoint publik yang sensitif
	loginLimit := middleware.LimitByIP(middleware.NewLimiter(20, time.Minute))
	registerLimit := middleware.LimitByIP(middleware.NewLimiter(10, time.Hour))
	resetLimit := middleware.LimitByIP(middleware.NewLimiter(10, 15*time.Minute))

	// AUTH (publik)
	r.POST("/register", registerLimit, handlers.Register)
	r.POST("/login", loginLimit, handlers.Login)
	r.POST("/forgot-password", resetLimit, handlers.ForgotPassword)
	r.POST("/reset-password", resetLimit, handlers.ResetPassword)
	r.POST("/verify-email", resetLimit, handlers.VerifyEmail)

	// Login Google: redirect ke Google -> callback -> kode sekali pakai -> tukar dengan JWT
	r.GET("/auth/google/login", gin.WrapF(handlers.HandleGoogleLogin))
	r.GET("/auth/google/callback", gin.WrapF(handlers.HandleGoogleCallback))
	r.POST("/auth/google/exchange", loginLimit, handlers.ExchangeLoginCode)

	// PROTECTED ROUTES
	protected := r.Group("/")
	protected.Use(middleware.RequireAuth)
	{
		protected.GET("/transactions", controllers.GetTransactions)
		protected.POST("/transactions", controllers.CreateTransaction)
		protected.PUT("/transactions/:id", controllers.UpdateTransaction)
		protected.DELETE("/transactions/:id", controllers.DeleteTransaction)

		// AI Prediction: maks 5 permintaan per user per menit (tiap request menjalankan Python)
		protected.GET("/predict", middleware.LimitByUser(middleware.NewLimiter(5, time.Minute)), controllers.PredictSpending)
	}

	if err := r.Run(":" + config.App.Port); err != nil {
		log.Fatal("Gagal menjalankan server:", err)
	}
}

// configureTrustedProxies menentukan dari mana alamat IP klien dibaca (dipakai rate limiter).
func configureTrustedProxies(r *gin.Engine) {
	proxies := config.App.TrustedProxies
	switch {
	case len(proxies) == 1 && proxies[0] == "none":
		_ = r.SetTrustedProxies(nil)
	case len(proxies) > 0:
		if err := r.SetTrustedProxies(proxies); err != nil {
			log.Fatal("❌ TRUSTED_PROXIES tidak valid: ", err)
		}
	default:
		log.Println("⚠️  TRUSTED_PROXIES kosong: header X-Forwarded-For dipercaya dari mana pun. " +
			"Set ke IP/CIDR proxy platform (atau \"none\" bila tanpa proxy) agar rate limit per IP tidak bisa diakali.")
	}
}

// corsMiddleware hanya mengizinkan origin frontend. Credentials tidak diaktifkan
// karena autentikasi memakai header Authorization, bukan cookie.
func corsMiddleware(allowedOrigin string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", allowedOrigin)
		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept")
		c.Header("Access-Control-Max-Age", "600")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
