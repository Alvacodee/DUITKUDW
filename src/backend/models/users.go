package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username string `json:"username" gorm:"unique"`
	Password string `json:"password"`
	Email    string `json:"email" gorm:"unique"`

	// Email terbukti milik user (login Google dengan email terverifikasi,
	// klik link verifikasi, atau berhasil reset password lewat email).
	EmailVerified bool `json:"-" gorm:"not null;default:false"`

	// Dinaikkan untuk membatalkan semua JWT lama user ini (mis. setelah reset password).
	TokenVersion uint `json:"-" gorm:"not null;default:0"`

	// Token sekali pakai disimpan sebagai hash SHA-256, bukan nilai aslinya.
	ResetToken        string    `json:"-"`
	ResetTokenExpiry  time.Time `json:"-"`
	VerifyToken       string    `json:"-"`
	VerifyTokenExpiry time.Time `json:"-"`
}

// Penanda password untuk akun yang hanya bisa login lewat Google.
// Bukan hash bcrypt yang valid, jadi bcrypt.CompareHashAndPassword selalu gagal.
const GoogleOnlyPassword = "GOOGLE_AUTH_USER"
