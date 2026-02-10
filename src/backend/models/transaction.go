package models

import "gorm.io/gorm"

type Transaction struct {
	gorm.Model
	UserID      uint   `json:"user_id"`
	Date        string `json:"date"`
	Description string `json:"description"`
	Amount      int    `json:"amount"`
	Category    string `json:"category"`
	Type        string `json:"type"`
}