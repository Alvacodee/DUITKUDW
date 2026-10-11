package handlers

import (
	"finance-tracker-backend/config"
	"finance-tracker-backend/models"
	"fmt"
	"os"
	"testing"
	"time"
)

// Integration test: butuh PostgreSQL. Jalankan dengan
//
//	TEST_DATABASE_URL=postgres://user@localhost:5432/db?sslmode=disable go test ./handlers/
//
// Tanpa env tersebut test di-skip.
func setupDB(t *testing.T) {
	t.Helper()
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL tidak di-set")
	}
	os.Setenv("DATABASE_URL", dsn)
	if config.DB == nil {
		config.ConnectDatabase()
	}
}

func uniqueEmail(prefix string) string {
	return fmt.Sprintf("%s%d@example.com", prefix, time.Now().UnixNano())
}

func TestGoogleCreatesVerifiedUser(t *testing.T) {
	setupDB(t)
	email := uniqueEmail("baru")
	user, notice, err := findOrCreateGoogleUser(GoogleUser{Email: email, Name: "Budi Santoso", VerifiedEmail: true})
	if err != nil {
		t.Fatal(err)
	}
	if !user.EmailVerified || user.Password != models.GoogleOnlyPassword || notice != "" {
		t.Fatalf("user baru tidak sesuai: %+v notice=%q", user, notice)
	}
}

func TestGoogleTakesOverUnverifiedPasswordAccount(t *testing.T) {
	setupDB(t)
	email := uniqueEmail("korban")
	// Akun yang didaftarkan (mungkin oleh penyerang) dengan email korban, belum diverifikasi
	victim := models.User{Username: fmt.Sprintf("pre%d", time.Now().UnixNano()), Email: email, Password: "$2a$10$hashpenyerang"}
	if err := config.DB.Create(&victim).Error; err != nil {
		t.Fatal(err)
	}

	user, notice, err := findOrCreateGoogleUser(GoogleUser{Email: email, Name: "Korban", VerifiedEmail: true})
	if err != nil {
		t.Fatal(err)
	}
	if user.ID != victim.ID {
		t.Fatalf("harus menautkan ke akun yang sama")
	}
	if !user.EmailVerified || user.Password != models.GoogleOnlyPassword {
		t.Fatalf("password lama harus dinonaktifkan & email terverifikasi: %+v", user)
	}
	if user.TokenVersion != victim.TokenVersion+1 {
		t.Fatalf("token_version harus naik: %d -> %d", victim.TokenVersion, user.TokenVersion)
	}
	if notice == "" {
		t.Fatal("user harus diberi tahu bahwa password lama dinonaktifkan")
	}
}

func TestGoogleKeepsVerifiedAccount(t *testing.T) {
	setupDB(t)
	email := uniqueEmail("terverifikasi")
	owner := models.User{Username: fmt.Sprintf("ver%d", time.Now().UnixNano()), Email: email, Password: "$2a$10$hashpemilik", EmailVerified: true}
	if err := config.DB.Create(&owner).Error; err != nil {
		t.Fatal(err)
	}

	user, notice, err := findOrCreateGoogleUser(GoogleUser{Email: "  " + email, Name: "Pemilik", VerifiedEmail: true})
	if err == nil && user.ID == owner.ID {
		t.Fatal("email dengan spasi tidak boleh cocok (sudah dinormalisasi oleh Google)")
	}

	user, notice, err = findOrCreateGoogleUser(GoogleUser{Email: email, Name: "Pemilik", VerifiedEmail: true})
	if err != nil {
		t.Fatal(err)
	}
	if user.Password != owner.Password || user.TokenVersion != owner.TokenVersion || notice != "" {
		t.Fatalf("akun terverifikasi tidak boleh diubah: %+v", user)
	}
}
