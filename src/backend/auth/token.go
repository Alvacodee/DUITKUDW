// Package auth berisi logika autentikasi yang dipakai bersama oleh handler
// login biasa, login Google, middleware, dan reset password.
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"finance-tracker-backend/models"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Masa berlaku JWT. Sama untuk login biasa dan login Google.
const TokenTTL = 7 * 24 * time.Hour

// Panjang minimum JWT_SECRET yang disarankan (256 bit untuk HS256).
const minSecretLength = 32

var ErrInvalidToken = errors.New("token tidak valid")

// CheckSecret dipanggil saat startup. Secret kosong menghentikan server;
// secret pendek hanya diberi peringatan agar deploy yang sudah berjalan tidak langsung mati.
func CheckSecret() {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		log.Fatal("❌ JWT_SECRET belum di-set di environment")
	}
	if len(secret) < minSecretLength {
		log.Printf("⚠️  JWT_SECRET hanya %d karakter; gunakan minimal %d karakter acak (mis. `openssl rand -hex 32`)", len(secret), minSecretLength)
	}
}

func secret() []byte { return []byte(os.Getenv("JWT_SECRET")) }

// IssueToken membuat JWT untuk user. Claim "ver" dicocokkan dengan users.token_version
// di middleware, sehingga menaikkan token_version membatalkan semua token lama user tsb.
func IssueToken(user models.User) (string, error) {
	now := time.Now()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      strconv.FormatUint(uint64(user.ID), 10),
		"username": user.Username,
		"ver":      user.TokenVersion,
		"iat":      now.Unix(),
		"exp":      now.Add(TokenTTL).Unix(),
	})
	return token.SignedString(secret())
}

// ParseToken memvalidasi tanda tangan & masa berlaku, lalu mengembalikan ID user dan versi token.
// Token lama (sebelum ada claim "ver" dan dengan "sub" berupa angka) tetap diterima.
func ParseToken(tokenString string) (userID uint, version uint, err error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("metode sign tidak valid")
		}
		return secret(), nil
	}, jwt.WithExpirationRequired())
	if err != nil || !token.Valid {
		return 0, 0, ErrInvalidToken
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, 0, ErrInvalidToken
	}

	switch sub := claims["sub"].(type) {
	case string:
		id, convErr := strconv.ParseUint(sub, 10, 64)
		if convErr != nil {
			return 0, 0, ErrInvalidToken
		}
		userID = uint(id)
	case float64:
		userID = uint(sub)
	}
	if userID == 0 {
		return 0, 0, ErrInvalidToken
	}

	if ver, ok := claims["ver"].(float64); ok && ver >= 0 {
		version = uint(ver)
	}
	return userID, version, nil
}

// RandomToken menghasilkan token hex acak dari nBytes byte (crypto/rand).
func RandomToken(nBytes int) (string, error) {
	b := make([]byte, nBytes)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// HashToken mengembalikan SHA-256 (hex) dari token. Dipakai agar token sekali pakai
// (reset password, verifikasi email, login code) tidak tersimpan dalam bentuk asli di DB.
func HashToken(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
