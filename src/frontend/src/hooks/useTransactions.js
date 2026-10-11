import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiRequest } from '../api/client';
import { sortNewest } from '../lib/transactions';

// State & operasi CRUD transaksi milik user yang sedang login.
// onUnauthorized dipanggil saat token ditolak (401) agar App bisa logout.
// onChanged dipanggil setelah data berubah (mis. untuk mereset hasil prediksi).
export function useTransactions(token, { onUnauthorized, onChanged } = {}) {
  // Data disimpan bersama token pemiliknya, sehingga setelah logout / ganti akun
  // data lama otomatis tidak terlihat tanpa perlu dikosongkan manual.
  const [store, setStore] = useState({ token: null, list: [] });
  const transactions = store.token === token ? store.list : [];

  const handleError = useCallback((err, fallback) => {
    if (err.status === 401) { onUnauthorized?.(); return; }
    toast.error(err.message || fallback);
  }, [onUnauthorized]);

  const fetchList = useCallback(
    () => apiRequest('/transactions', { token }).then((data) => (Array.isArray(data.data) ? sortNewest(data.data) : [])),
    [token]
  );

  const refresh = useCallback(async () => {
    try {
      const list = await fetchList();
      setStore({ token, list });
    } catch (err) {
      handleError(err, 'Gagal memuat data transaksi.');
    }
  }, [token, fetchList, handleError]);

  // Muat data setiap kali token berubah (login / ganti akun / refresh halaman)
  useEffect(() => {
    if (!token) return;
    let active = true;
    fetchList()
      .then((list) => active && setStore({ token, list }))
      .catch((err) => active && handleError(err, 'Gagal memuat data transaksi.'));
    return () => { active = false; };
  }, [token, fetchList, handleError]);

  // Simpan transaksi baru (id kosong) atau perbarui transaksi id. Return true jika berhasil.
  const save = useCallback(async (formData, id) => {
    try {
      await apiRequest(id ? `/transactions/${id}` : '/transactions', {
        method: id ? 'PUT' : 'POST',
        token,
        body:   { ...formData, amount: parseInt(formData.amount, 10) },
      });
      toast.success(id ? 'Transaksi diperbarui!' : 'Transaksi ditambahkan!');
      await refresh();
      onChanged?.();
      return true;
    } catch (err) {
      handleError(err, 'Gagal menyimpan transaksi.');
      return false;
    }
  }, [token, refresh, onChanged, handleError]);

  const remove = useCallback(async (id) => {
    try {
      await apiRequest(`/transactions/${id}`, { method: 'DELETE', token });
      toast.success('Transaksi dihapus.');
      await refresh();
      onChanged?.();
      return true;
    } catch (err) {
      handleError(err, 'Gagal menghapus transaksi.');
      return false;
    }
  }, [token, refresh, onChanged, handleError]);

  return { transactions, refresh, save, remove };
}
