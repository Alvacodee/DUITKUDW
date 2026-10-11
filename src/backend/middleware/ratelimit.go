package middleware

import (
	"fmt"
	"math"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// Limiter: rate limiter fixed-window sederhana di memori, per key.
// Cukup untuk satu instance backend; bila di-scale horizontal, ganti dengan Redis.
type Limiter struct {
	mu     sync.Mutex
	limit  int
	window time.Duration
	hits   map[string]*window
}

type window struct {
	count int
	reset time.Time
}

func NewLimiter(limit int, per time.Duration) *Limiter {
	l := &Limiter{limit: limit, window: per, hits: make(map[string]*window)}
	go l.cleanup()
	return l
}

// Allow mencatat satu percobaan untuk key dan mengembalikan apakah masih di bawah batas,
// beserta sisa waktu sampai jendela di-reset.
func (l *Limiter) Allow(key string) (bool, time.Duration) {
	now := time.Now()
	l.mu.Lock()
	defer l.mu.Unlock()

	w, ok := l.hits[key]
	if !ok || now.After(w.reset) {
		w = &window{reset: now.Add(l.window)}
		l.hits[key] = w
	}
	w.count++
	return w.count <= l.limit, w.reset.Sub(now)
}

func (l *Limiter) cleanup() {
	ticker := time.NewTicker(l.window)
	for range ticker.C {
		now := time.Now()
		l.mu.Lock()
		for k, w := range l.hits {
			if now.After(w.reset) {
				delete(l.hits, k)
			}
		}
		l.mu.Unlock()
	}
}

// TooManyRequests menulis respons 429 dengan header Retry-After.
func TooManyRequests(c *gin.Context, retryAfter time.Duration) {
	secs := int(math.Ceil(retryAfter.Seconds()))
	c.Header("Retry-After", fmt.Sprint(secs))
	c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
		"error": fmt.Sprintf("Terlalu banyak percobaan. Coba lagi dalam %d detik.", secs),
	})
}

// LimitByIP membatasi request per alamat IP klien untuk satu grup endpoint.
func LimitByIP(l *Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		if ok, retry := l.Allow(c.ClientIP()); !ok {
			TooManyRequests(c, retry)
			return
		}
		c.Next()
	}
}

// LimitByUser membatasi request per user yang sudah login (dipasang setelah RequireAuth).
func LimitByUser(l *Limiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()
		if u, ok := c.Get("userID"); ok {
			key = fmt.Sprint(u)
		}
		if ok, retry := l.Allow(key); !ok {
			TooManyRequests(c, retry)
			return
		}
		c.Next()
	}
}

// Limiter per akun (username / email) yang dipakai langsung di handler,
// karena key-nya baru diketahui setelah body JSON dibaca.
var (
	// Login: 10 percobaan per username per 15 menit (melawan brute force terdistribusi)
	LoginAccountLimiter = NewLimiter(10, 15*time.Minute)
	// Lupa password: 3 email per alamat per jam (mencegah email bombing)
	ResetEmailLimiter = NewLimiter(3, time.Hour)
)

// AccountKey menormalkan username/email sebelum dipakai sebagai key limiter.
func AccountKey(s string) string { return strings.ToLower(strings.TrimSpace(s)) }
