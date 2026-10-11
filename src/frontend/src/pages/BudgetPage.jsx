import CategoryBudgets from '../components/CategoryBudget';

export default function BudgetPage({ transactions, storageUser }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Perencanaan Anggaran</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tetapkan batas pengeluaran per kategori setiap bulan.
        </p>
      </div>
      <CategoryBudgets transactions={transactions} storageUser={storageUser} />
    </div>
  );
}
