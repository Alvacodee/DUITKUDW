# Gunakan base image Golang
FROM golang:1.25

# 1. Install 'uv' 
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 2. Setup Direktori Kerja
WORKDIR /app

# 3. Copy file definisi project UV dulu (agar caching layer Docker optimal)
COPY pyproject.toml uv.lock ./

# 4. Install Dependensi Python menggunakan 'uv sync'
# --frozen: Memaksa install sesuai uv.lock tanpa mengubahnya (best practice di CI/Docker)
RUN uv sync --frozen

# 5. Copy Dependency Go & Download
COPY go.mod go.sum ./
RUN go mod download

# 6. Copy Seluruh Source Code
COPY . .

# 7. Build Aplikasi Go
RUN go build -o finance-backend main.go

# 8. Expose Port & Jalankan
EXPOSE 8080
CMD ["./finance-backend"]