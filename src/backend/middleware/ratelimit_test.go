package middleware

import (
	"testing"
	"time"
)

func TestLimiterAllowsUpToLimit(t *testing.T) {
	l := NewLimiter(3, time.Minute)
	for i := 1; i <= 3; i++ {
		if ok, _ := l.Allow("a"); !ok {
			t.Fatalf("percobaan ke-%d seharusnya diizinkan", i)
		}
	}
	ok, retry := l.Allow("a")
	if ok {
		t.Fatal("percobaan ke-4 seharusnya ditolak")
	}
	if retry <= 0 || retry > time.Minute {
		t.Fatalf("retry-after tidak masuk akal: %v", retry)
	}
	if ok, _ := l.Allow("b"); !ok {
		t.Fatal("key lain tidak boleh ikut terblokir")
	}
}

func TestLimiterResetsAfterWindow(t *testing.T) {
	l := NewLimiter(1, 20*time.Millisecond)
	l.Allow("a")
	if ok, _ := l.Allow("a"); ok {
		t.Fatal("seharusnya ditolak dalam jendela yang sama")
	}
	time.Sleep(30 * time.Millisecond)
	if ok, _ := l.Allow("a"); !ok {
		t.Fatal("seharusnya diizinkan lagi setelah jendela berakhir")
	}
}
