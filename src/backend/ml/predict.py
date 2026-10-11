"""Prediksi total pengeluaran 30 hari ke depan.

Input  (stdin) : JSON array transaksi (field minimal: date, amount, type)
Output (stdout): JSON {prediction, trend, status, message, model_used}
Exit code 1 bila terjadi error (status "error"), sehingga backend bisa membedakannya.

Model adaptif:
- < 60 hari data  : Weighted Linear Regression (data terbaru diberi bobot lebih besar)
- >= 60 hari data : Holt-Winters dengan musiman 30 hari; fallback ke rata-rata harian bila gagal
"""
import json
import sys
import warnings

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from statsmodels.tools.sm_exceptions import ConvergenceWarning
from statsmodels.tsa.holtwinters import ExponentialSmoothing

FORECAST_DAYS = 30
SEASONAL_MIN_DAYS = 60  # 2 bulan: cukup untuk membaca pola bulanan
SEASONAL_PERIOD = 30
EXPENSE_TYPES = {"pengeluaran", "expense"}


class PredictionError(Exception):
    """Error yang pesannya aman ditampilkan (bukan bug di script)."""


def load_daily_expenses(transactions):
    """Ubah daftar transaksi menjadi deret harian total pengeluaran (hari kosong = 0)."""
    if not transactions:
        return pd.Series(dtype=float)

    df = pd.DataFrame(transactions)
    df.columns = [c.lower() for c in df.columns]

    date_col = next((c for c in ("date", "created_at", "createdat") if c in df.columns), None)
    if date_col is None:
        raise PredictionError("Kolom tanggal hilang")
    if "amount" not in df.columns:
        raise PredictionError("Kolom amount hilang")

    df["day"] = pd.to_datetime(df[date_col], errors="coerce").dt.normalize()
    df = df.dropna(subset=["day"])

    amount = df["amount"]
    if amount.dtype == object:
        # Rupiah tanpa desimal; titik/koma adalah pemisah ribuan ("Rp 10.000" -> 10000)
        amount = amount.astype(str).str.replace(r"[^\d]", "", regex=True)
    df["amount"] = pd.to_numeric(amount, errors="coerce").fillna(0)

    if "type" in df.columns:
        df = df[df["type"].astype(str).str.lower().isin(EXPENSE_TYPES)]

    if df.empty:
        return pd.Series(dtype=float)

    daily = df.groupby("day")["amount"].sum().sort_index()
    return daily.asfreq("D", fill_value=0).astype(float)


def trend_label(slope):
    if slope > 0:
        return "naik"
    if slope < 0:
        return "turun"
    return "flat"


def predict_linear(daily):
    """Regresi linear berbobot; hasil harian negatif dipotong ke 0."""
    days = np.arange(len(daily)).reshape(-1, 1)
    weights = np.linspace(1, 3, len(daily))
    model = LinearRegression().fit(days, daily.values, sample_weight=weights)

    future = np.arange(len(daily), len(daily) + FORECAST_DAYS).reshape(-1, 1)
    total = np.clip(model.predict(future), 0, None).sum()
    return int(round(total)), trend_label(round(float(model.coef_[0]), 6))


def predict_holt_winters(daily):
    """Holt-Winters musiman; tren = prediksi 30 hari vs total 30 hari terakhir."""
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", ConvergenceWarning)
        model = ExponentialSmoothing(
            daily, trend="add", seasonal="add", seasonal_periods=SEASONAL_PERIOD
        ).fit()
    forecast = np.clip(model.forecast(FORECAST_DAYS).values, 0, None)
    total = int(round(forecast.sum()))
    last_period = daily.tail(FORECAST_DAYS).sum()
    return total, trend_label(total - last_period)


def predict(transactions):
    daily = load_daily_expenses(transactions)
    if daily.empty:
        return {
            "prediction": 0,
            "trend": "flat",
            "status": "not_enough_data",
            "message": "Belum ada data pengeluaran dengan tanggal yang valid.",
            "model_used": "",
        }

    total_days = len(daily)
    if total_days < SEASONAL_MIN_DAYS:
        prediction, trend = predict_linear(daily)
        model_used = "Weighted Regression"
        prefix = f"Data ({total_days} hari) masih dalam fase awal. Menggunakan estimasi tren linear."
    else:
        try:
            prediction, trend = predict_holt_winters(daily)
            model_used = "Holt-Winters AI"
            prefix = f"Data ({total_days} hari) cukup kaya! AI mendeteksi pola siklus bulananmu."
        except (ValueError, np.linalg.LinAlgError) as exc:
            # Mis. data terlalu banyak nol sehingga model tidak bisa di-fit
            sys.stderr.write(f"Holt-Winters gagal: {exc}; fallback ke rata-rata harian\n")
            prediction = int(round(daily.mean() * FORECAST_DAYS))
            trend = trend_label(daily.tail(FORECAST_DAYS).mean() - daily.mean())
            model_used = "Fallback Average"
            prefix = f"Data ({total_days} hari) tidak cukup bervariasi, menggunakan rata-rata harian."

    return {
        "prediction": prediction,
        "trend": trend,
        "status": "success",
        "message": f"{prefix} Tren terlihat {trend}.",
        "model_used": model_used,
    }


def main():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            raise PredictionError("Input kosong")
        result = predict(json.loads(raw))
    except (PredictionError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "error", "message": str(exc)}))
        return 1
    except Exception as exc:  # bug tak terduga: tetap keluarkan JSON agar backend bisa mencatatnya
        sys.stderr.write(f"Python Error: {exc!r}\n")
        print(json.dumps({"status": "error", "message": "Kesalahan internal"}))
        return 1

    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
