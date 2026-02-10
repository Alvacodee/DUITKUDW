// Tambahkan prop 'text' di sini
export default function DashboardStats({ transactions, darkMode, text }) {
  const totalIncome = transactions.filter(t => t.type === 'Pemasukan').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Pengeluaran').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const formatRupiah = (num) => "Rp " + num.toLocaleString('id-ID');

  // Fallback labels
  const labels = text || {
     balance: "💰 Saldo Saat Ini",
     income: "📥 Total Pemasukan",
     expense: "📤 Total Pengeluaran"
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div className="bg-blue-600 text-white p-6 rounded-xl shadow-lg">
        {/* Gunakan labels.balance */}
        <div className="text-blue-100 text-sm mb-1">{labels.balance}</div>
        <div className="text-3xl font-bold">{formatRupiah(balance)}</div>
      </div>
      <div className="bg-emerald-500 text-white p-6 rounded-xl shadow-lg">
        {/* Gunakan labels.income */}
        <div className="text-emerald-100 text-sm mb-1">{labels.income}</div>
        <div className="text-2xl font-bold">{formatRupiah(totalIncome)}</div>
      </div>
      <div className="bg-rose-500 text-white p-6 rounded-xl shadow-lg">
        {/* Gunakan labels.expense */}
        <div className="text-rose-100 text-sm mb-1">{labels.expense}</div>
        <div className="text-2xl font-bold">{formatRupiah(totalExpense)}</div>
      </div>
    </div>
  );
}