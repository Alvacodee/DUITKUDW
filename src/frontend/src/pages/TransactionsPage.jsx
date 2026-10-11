import { useMemo, useState } from 'react';
import ExpenseChart from '../components/ExpenseChart';
import TransactionForm from '../components/TransactionForm';
import TransactionList from './TransactionList';
import { getSmartTip } from '../lib/insights';

export default function TransactionsPage({ transactions, onSave, onDelete }) {
  const [editItem, setEditItem] = useState(null);
  const smartTip = useMemo(() => getSmartTip(transactions), [transactions]);

  const handleSubmit = async (formData) => {
    const ok = await onSave(formData, editItem?.ID);
    if (ok) setEditItem(null);
    return ok;
  };

  const handleDelete = async (id) => {
    const ok = await onDelete(id);
    if (ok && editItem?.ID === id) setEditItem(null);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ExpenseChart transactions={transactions} />
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center shadow-sm">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-3xl dark:bg-amber-900/30">
            💡
          </div>
          <h3 className="mb-2 text-lg font-bold">{smartTip.title}</h3>
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{smartTip.text}</p>
        </div>
      </div>
      {/* key: form di-remount setiap item edit berganti agar isinya ikut berganti */}
      <TransactionForm
        key={editItem?.ID ?? 'new'}
        onSubmit={handleSubmit}
        initialData={editItem}
        isEditMode={!!editItem}
        onCancel={() => setEditItem(null)}
      />
      <TransactionList
        transactions={transactions}
        onEdit={setEditItem}
        onDelete={handleDelete}
        editId={editItem?.ID}
      />
    </div>
  );
}
