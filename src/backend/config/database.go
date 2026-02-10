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
	// Ambil konfigurasi dari Environment Variables (diset oleh Docker)
	dbHost := os.Getenv("DB_HOST")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbPort := os.Getenv("DB_PORT")

	// FALLBACK
	// Jika env kosong (artinya kita jalankan manual 'go run main.go' tanpa Docker),
	// maka pakailah settingan default localhost ini.
	if dbHost == "" {
		dbHost = "localhost"
		dbUser = "postgres"
		dbPassword = "Zalvan0129"
		dbName = "finance_tracker"
		dbPort = "5432"
	}

	// Buat String Koneksi (DSN)
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Jakarta",
		dbHost, dbUser, dbPassword, dbName, dbPort,
	)

	//  Koneksi ke Database
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatal("Gagal koneksi ke database: ", err)
	}

	// Auto Migrate (Membuat tabel otomatis)
	// Pastikan model User & Transaction sudah terdaftar di sini
	err = database.AutoMigrate(&models.User{}, &models.Transaction{})
	if err != nil {
		log.Fatal("Gagal migrasi database: ", err)
	}

	DB = database
	fmt.Println("🚀 Database connected successfully to:", dbHost)
}