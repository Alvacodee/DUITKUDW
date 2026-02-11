package config

import (
	"finance-tracker-backend/models"
	"fmt"
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDatabase() {
	// 1. Ambil URL dari .env
	dsn := os.Getenv("DATABASE_URL")

	// 2. Jika tidak ada (untuk Localhost)
	if dsn == "" {
		dbHost := os.Getenv("DB_HOST")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")
		dbPort := os.Getenv("DB_PORT")

		if dbHost == "" {
			dbHost = "localhost"
			dbUser = "postgres"
			dbPassword = "Zalvan0129"
			dbName = "finance_tracker"
			dbPort = "5432"
		}

		dsn = fmt.Sprintf(
			"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
			dbHost, dbUser, dbPassword, dbName, dbPort,
		)
	}

	// 3. KUNCI UTAMA SUPABASE: Matikan Prepared Statements
	// Ini yang membuat error "Tenant not found" musnah
	database, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // WAJIB TRUE UNTUK SUPABASE
	}), &gorm.Config{})

	if err != nil {
		log.Fatal("❌ Gagal koneksi ke database: ", err)
	}

	err = database.AutoMigrate(&models.User{}, &models.Transaction{})
	if err != nil {
		log.Fatal("❌ Gagal migrasi database: ", err)
	}

	DB = database

	if os.Getenv("DATABASE_URL") != "" {
		fmt.Println("🚀 Database connected successfully to: Supabase Cloud")
	} else {
		fmt.Println("🚀 Database connected successfully to: Local Docker")
	}
}