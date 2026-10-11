package models

import "time"

// LoginCode adalah kode sekali pakai berumur pendek yang dikirim ke frontend
// setelah login Google berhasil. Frontend menukarnya dengan JWT lewat POST,
// sehingga JWT tidak pernah muncul di URL (riwayat browser / log server).
// Yang disimpan hanya hash SHA-256 dari kode, bukan kode aslinya.
type LoginCode struct {
	ID        uint      `gorm:"primaryKey"`
	CodeHash  string    `gorm:"uniqueIndex;size:64;not null"`
	UserID    uint      `gorm:"not null"`
	ExpiresAt time.Time `gorm:"index;not null"`
	CreatedAt time.Time
}
