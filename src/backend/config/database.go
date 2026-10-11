package config

import (
	"finance-tracker-backend/models"
	"log"
	"net/url"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

// buildDSN memakai DATABASE_URL bila ada (Supabase / cloud). Selain itu menyusun URL
// dari DB_* per-field. Format URL dipakai (bukan "key=value") agar password kosong atau
// berisi spasi/karakter khusus tidak merusak parsing (BUG-21).
func buildDSN() (dsn string, source string) {
	if v := os.Getenv("DATABASE_URL"); v != "" {
		return v, "DATABASE_URL"
	}

	u := url.URL{
		Scheme: "postgres",
		Host:   getEnv("DB_HOST", "localhost") + ":" + getEnv("DB_PORT", "5432"),
		Path:   "/" + getEnv("DB_NAME", "finance_tracker"),
	}
	// Password TIDAK di-hardcode, wajib dari env
	if pw := os.Getenv("DB_PASSWORD"); pw != "" {
		u.User = url.UserPassword(getEnv("DB_USER", "postgres"), pw)
	} else {
		u.User = url.User(getEnv("DB_USER", "postgres"))
	}
	// sslmode: container lokal tanpa TLS; gunakan "require" untuk server remote.
	// TimeZone ditulis apa adanya: driver GORM membaca nilai ini dari DSN mentah (regex),
	// sehingga versi ter-encode ("Asia%2FJakarta") tidak dikenali.
	u.RawQuery = "sslmode=" + url.QueryEscape(getEnv("DB_SSLMODE", "disable")) + "&TimeZone=Asia/Jakarta"
	return u.String(), "DB_HOST " + u.Host
}

func ConnectDatabase() {
	dsn, source := buildDSN()

	// PreferSimpleProtocol: matikan prepared statements. Wajib untuk connection pooler
	// Supabase (PgBouncer mode transaction), kalau tidak muncul error "Tenant not found".
	database, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true,
	}), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Gagal koneksi ke database: ", err)
	}

	if err := database.AutoMigrate(&models.User{}, &models.Transaction{}, &models.LoginCode{}); err != nil {
		log.Fatal("❌ Gagal migrasi database: ", err)
	}
	migrateData(database)

	DB = database
	log.Println("🚀 Database terhubung via", source)
}

// migrateData: perbaikan data idempoten (aman dijalankan di setiap startup).
func migrateData(db *gorm.DB) {
	// Akun yang dibuat lewat Google sudah pasti emailnya terverifikasi
	db.Model(&models.User{}).
		Where("password = ? AND email_verified = ?", models.GoogleOnlyPassword, false).
		Update("email_verified", true)

	// INC-02: data lama bisa berisi "expense"/"income" (huruf apa pun). Samakan ke nilai baku.
	db.Model(&models.Transaction{}).
		Where("LOWER(type) IN ? AND type <> ?", []string{"expense", "pengeluaran"}, models.TypeExpense).
		Update("type", models.TypeExpense)
	db.Model(&models.Transaction{}).
		Where("LOWER(type) IN ? AND type <> ?", []string{"income", "pemasukan"}, models.TypeIncome).
		Update("type", models.TypeIncome)
}
