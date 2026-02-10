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
	ResetToken        string     `json:"-"` // "-" tidak ikut dalam JSON response
	ResetTokenExpiry  time.Time  `json:"-"`
}