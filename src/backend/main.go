package main

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/controllers"
	"finance-tracker-backend/handlers"
	"finance-tracker-backend/middleware"
	"log"

	"github.com/gin-gonic/gin"
)

func main() {
	// Konek Database
	config.ConnectDatabase()

	// Init Google Auth Config
	handlers.InitGoogleAuth()

	// Setup Router
	r := gin.Default()

	// Middleware CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// ROUTING STANDAR
	r.POST("/register", controllers.Register)
	r.POST("/login", controllers.Login)
	r.POST("/forgot-password", handlers.ForgotPassword)
	r.POST("/reset-password", handlers.ResetPassword)

	
	// Route Login: Redirect ke Google
	// gin.WrapF karena HandleGoogleLogin signature-nya (w, r)
	r.GET("/auth/google/login", gin.WrapF(handlers.HandleGoogleLogin))

	// Route Callback: Menerima data dari Google
	sqlDB, err := config.DB.DB() 
	if err != nil {
		log.Fatal("Gagal mengambil instance SQL DB:", err)
	}

	// gin.WrapH karena HandleGoogleCallback me-return http.Handler
	r.GET("/auth/google/callback", gin.WrapH(handlers.HandleGoogleCallback(sqlDB)))

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
		protected.GET("/predict", controllers.PredictSpending)
	}

	// Jalankan Server
	r.Run(":8080")
}