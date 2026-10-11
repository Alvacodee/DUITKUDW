package config

import (
	"net/url"
	"strings"
	"testing"
)

func TestBuildDSNFromFields(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("DB_HOST", "db")
	t.Setenv("DB_PORT", "5433")
	t.Setenv("DB_USER", "app")
	t.Setenv("DB_PASSWORD", "p@ss word/#")
	t.Setenv("DB_NAME", "finance")
	t.Setenv("DB_SSLMODE", "")

	dsn, _ := buildDSN()
	u, err := url.Parse(dsn)
	if err != nil {
		t.Fatal(err)
	}
	pw, _ := u.User.Password()
	if u.Host != "db:5433" || u.Path != "/finance" || u.User.Username() != "app" || pw != "p@ss word/#" {
		t.Fatalf("DSN salah: %s", dsn)
	}
	if u.Query().Get("sslmode") != "disable" {
		t.Fatalf("sslmode default harus disable: %s", dsn)
	}
	// Driver GORM membaca TimeZone dari DSN mentah; tidak boleh ter-encode
	if !strings.Contains(dsn, "TimeZone=Asia/Jakarta") {
		t.Fatalf("TimeZone harus tidak ter-encode: %s", dsn)
	}
}

// BUG-21: password kosong tidak boleh membuat nama database hilang
func TestBuildDSNEmptyPassword(t *testing.T) {
	t.Setenv("DATABASE_URL", "")
	t.Setenv("DB_PASSWORD", "")
	t.Setenv("DB_NAME", "duitku")

	dsn, _ := buildDSN()
	u, _ := url.Parse(dsn)
	if u.Path != "/duitku" {
		t.Fatalf("nama database hilang: %s", dsn)
	}
	if _, set := u.User.Password(); set {
		t.Fatalf("password kosong tidak boleh ditulis: %s", dsn)
	}
}

func TestBuildDSNPrefersDatabaseURL(t *testing.T) {
	t.Setenv("DATABASE_URL", "postgres://x@cloud/db")
	if dsn, src := buildDSN(); dsn != "postgres://x@cloud/db" || src != "DATABASE_URL" {
		t.Fatalf("DATABASE_URL harus diprioritaskan, got %s (%s)", dsn, src)
	}
}
