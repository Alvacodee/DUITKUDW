import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '../api/client';

const TREND_ICON = { naik: '📈', turun: '📉', flat: '➖' };

// Memanggil /predict dan mengubah respons backend menjadi data tampilan PredictionCard.
export function usePrediction(token, { onUnauthorized } = {}) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const reset = useCallback(() => setPrediction(null), []);

  const predict = useCallback(async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const data = await apiRequest('/predict', { token });

      // Data belum cukup / kosong: backend tetap 200 tapi tanpa prediksi bermakna
      if (data.status !== 'success') {
        setPrediction({
          trend:      null,
          prediction: data.prediction || 0,
          status:     'Data Belum Cukup ⏳',
          message:    data.message || 'Tambahkan lebih banyak transaksi pengeluaran.',
        });
        return;
      }

      const trend = data.trend || 'flat';
      setPrediction({
        trend,
        prediction: data.prediction,
        status:     `Tren ${trend.charAt(0).toUpperCase() + trend.slice(1)} ${TREND_ICON[trend] ?? ''}`.trim(),
        message:    data.message,
      });
      toast.success('Prediksi AI berhasil!');
    } catch (err) {
      if (err.status === 401) { onUnauthorized?.(); return; }
      // Pesan dari server (mis. 429 terlalu sering / 503 AI sibuk) ditampilkan apa adanya
      setPrediction({ trend: null, prediction: 0, status: 'Gagal', message: err.message });
      toast.error('Prediksi AI gagal.');
    } finally {
      setLoading(false);
    }
  }, [token, onUnauthorized]);

  return { prediction, loading, predict, reset };
}
