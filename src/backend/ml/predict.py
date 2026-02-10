import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings
warnings.filterwarnings("ignore")

def predict():
    try:
        # BACA DATA
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({"error": "No data"}))
            return

        transactions = json.loads(input_data)
        if not transactions:
            print(json.dumps({"prediction": 0, "status": "empty", "message": "Data kosong"}))
            return

        df = pd.DataFrame(transactions)

        # PREPROCESSING
        # Normalisasi nama kolom
        df.columns = [x.lower() for x in df.columns]
        
        # Cari kolom tanggal
        date_col = next((col for col in ['date', 'created_at', 'createdat'] if col in df.columns), None)
        if not date_col:
            print(json.dumps({"status": "error", "message": "Kolom tanggal hilang"}))
            return

        df['date_obj'] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=['date_obj'])
        df['date'] = df['date_obj'].dt.date
        
        # Bersihkan amount
        if df['amount'].dtype == object:
             df['amount'] = df['amount'].astype(str).str.replace(r'[^\d.]', '', regex=True)
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0)

        # Filter hanya Pengeluaran
        if 'type' in df.columns:
            df = df[df['type'].str.lower().isin(['pengeluaran', 'expense'])]

        # GROUP BY DATE
        daily_df = df.groupby('date')['amount'].sum().reset_index()
        daily_df = daily_df.sort_values('date')
        
        # Set index tanggal untuk Time Series (butuh buat Holt-Winters)
        daily_df['date'] = pd.to_datetime(daily_df['date'])
        daily_df.set_index('date', inplace=True)
        
        # Isi tanggal yang bolong dengan 0 (Resampling)
        # Agar data menjadi continuous (diperlukan untuk algoritma canggih)
        daily_df = daily_df.asfreq('D').fillna(0)

        # Cek jumlah hari data
        total_days = len(daily_df)
        
        # MODEL SELECTION (LOGIKA ADAPTIF)
        
        prediction_result = 0
        trend_status = "flat"
        model_name = ""
        message_prefix = ""

        # BATAS DATA: 60 Hari (2 Bulan)
        # Jika < 60 hari: Pakai Regresi Linear (Data belum cukup pola musimannya)
        # Jika >= 60 hari: Pakai Holt-Winters (Sudah bisa baca siklus bulanan)

        if total_days < 60:
            # ALGORITMA 1: WEIGHTED LINEAR REGRESSION (SIMPLE)
            model_name = "Weighted Regression"
            
            # Kembalikan ke format numeric untuk regresi
            daily_df['days'] = np.arange(len(daily_df))
            X = daily_df[['days']]
            y = daily_df['amount']
            
            # Bobot (Data baru lebih penting)
            weights = np.linspace(1, 3, len(daily_df))
            
            model = LinearRegression()
            model.fit(X, y, sample_weight=weights)
            
            # Prediksi 30 hari ke depan
            future_days = np.array(range(total_days, total_days + 30)).reshape(-1, 1)
            future_pred = model.predict(future_days)
            
            # Logika Tren
            trend_status = "naik" if model.coef_[0] > 0 else "turun"
            
            # Sum hasil (handle minus)
            weighted_avg = np.average(y, weights=weights)
            total_pred = 0
            for val in future_pred:
                if val < 0: total_pred += (weighted_avg * 0.5)
                else: total_pred += val
            
            prediction_result = int(total_pred)
            message_prefix = f"Data ({total_days} hari) masih dalam fase awal. Menggunakan estimasi tren linear."

        else:
            # ALGORITMA 2: HOLT-WINTERS EXPONENTIAL SMOOTHING (ADVANCED)
            # Algoritma ini bisa mendeteksi 'Seasonality' (Pola Bulanan)
            model_name = "Holt-Winters AI"
            
            try:
                # seasonal_periods=30 artinya mencari pola pengulangan tiap 30 hari (bulanan)
                model = ExponentialSmoothing(
                    daily_df['amount'], 
                    trend='add', 
                    seasonal='add', 
                    seasonal_periods=30 
                ).fit()
                
                # Ramal 30 hari ke depan
                future_pred = model.forecast(30)
                
                # Bersihkan hasil (kadang ada minus kecil)
                future_pred[future_pred < 0] = 0
                
                prediction_result = int(future_pred.sum())
                
                # Tentukan tren dengan membandingkan rata-rata prediksi vs rata-rata sejarah
                if prediction_result > daily_df['amount'].sum(): 
                    trend_status = "naik"
                else:
                    trend_status = "turun"
                    
                message_prefix = f"Data ({total_days} hari) cukup kaya! AI mendeteksi pola siklus bulananmu."
                
            except Exception as e:
                # Fallback ke Linear jika Holt-Winters gagal (misal data terlalu 0 semua)
                sys.stderr.write(f"HW Error: {str(e)}, fallback to Linear.\n")
                prediction_result = int(daily_df['amount'].mean() * 30)
                model_name = "Fallback Average"

        # OUTPUT FINAL
        result = {
            "prediction": prediction_result,
            "trend": trend_status,
            "status": "success",
            "message": f"{message_prefix} Tren terlihat {trend_status}.",
            "model_used": model_name
        }
        print(json.dumps(result))

    except Exception as e:
        sys.stderr.write(f"Python Error: {str(e)}\n")
        print(json.dumps({"error": str(e), "status": "error"}))

if __name__ == "__main__":
    predict()