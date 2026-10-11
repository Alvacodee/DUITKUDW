package auth

import (
	"finance-tracker-backend/models"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

func TestMain(m *testing.M) {
	os.Setenv("JWT_SECRET", "test-secret-0123456789abcdef0123456789abcdef")
	os.Exit(m.Run())
}

func TestIssueAndParseToken(t *testing.T) {
	user := models.User{Model: gorm.Model{ID: 42}, Username: "budi", TokenVersion: 3}
	tok, err := IssueToken(user)
	if err != nil {
		t.Fatal(err)
	}
	id, ver, err := ParseToken(tok)
	if err != nil || id != 42 || ver != 3 {
		t.Fatalf("got id=%d ver=%d err=%v", id, ver, err)
	}
}

func TestParseLegacyNumericSubToken(t *testing.T) {
	// Token lama: "sub" angka, tanpa "ver" -> tetap valid dengan versi 0
	legacy := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": 7, "exp": time.Now().Add(time.Hour).Unix(),
	})
	s, _ := legacy.SignedString(secret())
	id, ver, err := ParseToken(s)
	if err != nil || id != 7 || ver != 0 {
		t.Fatalf("got id=%d ver=%d err=%v", id, ver, err)
	}
}

func TestParseTokenRejects(t *testing.T) {
	cases := map[string]jwt.MapClaims{
		"expired":   {"sub": "1", "exp": time.Now().Add(-time.Minute).Unix()},
		"no exp":    {"sub": "1"},
		"no sub":    {"exp": time.Now().Add(time.Hour).Unix()},
		"bad sub":   {"sub": "abc", "exp": time.Now().Add(time.Hour).Unix()},
		"zero user": {"sub": "0", "exp": time.Now().Add(time.Hour).Unix()},
	}
	for name, claims := range cases {
		s, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret())
		if _, _, err := ParseToken(s); err == nil {
			t.Errorf("%s: expected error", name)
		}
	}

	wrongKey, _ := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": "1", "exp": time.Now().Add(time.Hour).Unix(),
	}).SignedString([]byte("kunci-lain"))
	if _, _, err := ParseToken(wrongKey); err == nil {
		t.Error("token dengan secret berbeda harus ditolak")
	}

	none, _ := jwt.NewWithClaims(jwt.SigningMethodNone, jwt.MapClaims{
		"sub": "1", "exp": time.Now().Add(time.Hour).Unix(),
	}).SignedString(jwt.UnsafeAllowNoneSignatureType)
	if _, _, err := ParseToken(none); err == nil {
		t.Error("alg=none harus ditolak")
	}
}

func TestValidatePassword(t *testing.T) {
	cases := map[string]bool{
		"Rahasia#2026":   true,
		"pendek":         false,
		"semuakecil1!":   false,
		"SEMUABESAR1!":   false,
		"TanpaAngka!!":   false,
		"TanpaSimbol123": false,
		"Sangat#Panjang1" + string(make([]byte, 80)): false,
	}
	for pw, ok := range cases {
		if got := ValidatePassword(pw) == ""; got != ok {
			t.Errorf("%q: valid=%v, want %v (%s)", pw, got, ok, ValidatePassword(pw))
		}
	}
}

func TestValidateUsername(t *testing.T) {
	for u, ok := range map[string]bool{
		"budi": true, "budi_santoso.99": true, "ab": false, "nama dengan spasi": false, "<script>": false,
	} {
		if got := ValidateUsername(u) == ""; got != ok {
			t.Errorf("%q: valid=%v, want %v", u, got, ok)
		}
	}
}

func TestHashTokenDeterministic(t *testing.T) {
	if HashToken("abc") != HashToken("abc") || HashToken("abc") == HashToken("abd") {
		t.Fatal("HashToken tidak deterministik / bentrok")
	}
	if len(HashToken("x")) != 64 {
		t.Fatal("panjang hash harus 64 hex")
	}
}
