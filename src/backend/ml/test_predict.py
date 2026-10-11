"""Unit test predict.py. Jalankan dari src/backend:  uv run python -m unittest discover -s ml"""
import io
import json
import sys
import unittest
from contextlib import redirect_stdout
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import predict  # noqa: E402


def tx(days_ago, amount, type_="Pengeluaran", today=date(2026, 10, 1)):
    return {"date": (today - timedelta(days=days_ago)).isoformat(), "amount": amount, "type": type_}


def run_main(payload):
    sys.stdin = io.StringIO(payload)
    buf = io.StringIO()
    try:
        with redirect_stdout(buf):
            code = predict.main()
    finally:
        sys.stdin = sys.__stdin__
    return code, json.loads(buf.getvalue())


class LoadDailyExpensesTest(unittest.TestCase):
    def test_fills_gaps_and_ignores_income(self):
        daily = predict.load_daily_expenses([
            tx(0, 100), tx(2, 50), tx(2, 25), tx(1, 999, "Pemasukan"),
        ])
        self.assertEqual(list(daily.values), [75.0, 0.0, 100.0])

    def test_accepts_legacy_expense_type_and_string_amount(self):
        daily = predict.load_daily_expenses([tx(0, "Rp 10.000", "expense")])
        self.assertEqual(daily.iloc[0], 10000.0)

    def test_invalid_dates_are_dropped(self):
        daily = predict.load_daily_expenses([{"date": "bukan tanggal", "amount": 1, "type": "Pengeluaran"}])
        self.assertTrue(daily.empty)

    def test_missing_date_column_is_error(self):
        with self.assertRaises(predict.PredictionError):
            predict.load_daily_expenses([{"amount": 1}])


class PredictTest(unittest.TestCase):
    def test_increasing_spending_is_naik(self):
        result = predict.predict([tx(i, 1000 + (30 - i) * 100) for i in range(30)])
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["trend"], "naik")
        self.assertEqual(result["model_used"], "Weighted Regression")
        self.assertGreater(result["prediction"], 0)

    def test_decreasing_spending_never_negative(self):
        # BUG-19: prediksi harian negatif dipotong ke 0, bukan diganti angka arbitrer
        result = predict.predict([tx(i, i * 1000) for i in range(20)])
        self.assertEqual(result["trend"], "turun")
        self.assertGreaterEqual(result["prediction"], 0)

    def test_constant_spending_is_flat(self):
        # BUG-19: kemiringan nol dulu dilaporkan sebagai "turun"
        result = predict.predict([tx(i, 5000) for i in range(10)])
        self.assertEqual(result["trend"], "flat")
        self.assertEqual(result["prediction"], 150000)

    def test_long_history_uses_holt_winters(self):
        rows = [tx(i, 20000 + (5000 if (i % 30) < 3 else 0)) for i in range(90)]
        result = predict.predict(rows)
        self.assertEqual(result["status"], "success")
        self.assertIn(result["model_used"], ("Holt-Winters AI", "Fallback Average"))
        self.assertIn(result["trend"], ("naik", "turun", "flat"))

    def test_no_expense_is_not_enough_data(self):
        result = predict.predict([tx(0, 100, "Pemasukan")])
        self.assertEqual(result["status"], "not_enough_data")


class MainTest(unittest.TestCase):
    def test_success_exit_code_zero(self):
        code, out = run_main(json.dumps([tx(0, 100), tx(1, 200)]))
        self.assertEqual(code, 0)
        self.assertEqual(out["status"], "success")

    def test_invalid_json_exit_code_one(self):
        code, out = run_main("{bukan json")
        self.assertEqual(code, 1)
        self.assertEqual(out["status"], "error")

    def test_empty_input_exit_code_one(self):
        code, out = run_main("   ")
        self.assertEqual(code, 1)
        self.assertEqual(out["status"], "error")


if __name__ == "__main__":
    unittest.main()
