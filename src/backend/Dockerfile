# ── Stage 1: build binary Go (statis) ───────────────────────────────
FROM golang:1.25 AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/finance-backend .

# ── Stage 2: runtime (Python untuk ML + binary Go) ─────────────────
FROM python:3.13-slim

# uv di-pin agar build reproducible (bukan :latest)
COPY --from=ghcr.io/astral-sh/uv:0.9.10 /uv /bin/uv

# Pakai Python dari image (jangan unduh), virtualenv di /app/.venv
ENV UV_PYTHON_DOWNLOADS=never \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    GIN_MODE=release

WORKDIR /app

# Dependensi Python dulu agar layer cache optimal
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

COPY ml/predict.py ml/predict.py
COPY --from=build /out/finance-backend ./finance-backend

# Jalankan sebagai user non-root
RUN useradd --system --uid 10001 --no-create-home app
USER app

EXPOSE 8080
CMD ["./finance-backend"]
