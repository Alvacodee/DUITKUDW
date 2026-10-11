package models

import "gorm.io/gorm"

// Nilai baku kolom Type. Nilai lain ditolak saat input dan dinormalisasi saat startup.
const (
	TypeIncome  = "Pemasukan"
	TypeExpense = "Pengeluaran"
)

type Transaction struct {
	gorm.Model
	UserID      uint   `json:"user_id" gorm:"index:idx_transactions_user_date,priority:1"`
	Date        string `json:"date" gorm:"index:idx_transactions_user_date,priority:2"` // YYYY-MM-DD
	Description string `json:"description"`
	Amount      int    `json:"amount"`
	Category    string `json:"category"`
	Type        string `json:"type"`
}
