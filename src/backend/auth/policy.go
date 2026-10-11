package auth

import (
	"regexp"
	"unicode"
)

// Aturan ini harus sama dengan PASSWORD_RULES di src/frontend/src/lib/passwordPolicy.js
const (
	MinPasswordLength = 8
	// bcrypt hanya memakai 72 byte pertama; password lebih panjang ditolak agar tidak menyesatkan
	MaxPasswordBytes = 72
)

// ValidatePassword mengembalikan pesan error (bahasa Indonesia) atau "" bila valid.
func ValidatePassword(p string) string {
	if len([]rune(p)) < MinPasswordLength {
		return "Password minimal 8 karakter"
	}
	if len(p) > MaxPasswordBytes {
		return "Password maksimal 72 byte"
	}
	var upper, lower, digit, symbol bool
	for _, r := range p {
		switch {
		case unicode.IsUpper(r):
			upper = true
		case unicode.IsLower(r):
			lower = true
		case unicode.IsDigit(r):
			digit = true
		case !unicode.IsLetter(r) && !unicode.IsSpace(r):
			symbol = true
		}
	}
	switch {
	case !upper:
		return "Password harus mengandung huruf besar (A-Z)"
	case !lower:
		return "Password harus mengandung huruf kecil (a-z)"
	case !digit:
		return "Password harus mengandung angka (0-9)"
	case !symbol:
		return "Password harus mengandung simbol (!@#$%...)"
	}
	return ""
}

var usernamePattern = regexp.MustCompile(`^[A-Za-z0-9_.]{3,32}$`)

// ValidateUsername: 3–32 karakter, huruf/angka/underscore/titik.
func ValidateUsername(u string) string {
	if !usernamePattern.MatchString(u) {
		return "Username 3-32 karakter, hanya huruf, angka, titik, atau underscore"
	}
	return ""
}
