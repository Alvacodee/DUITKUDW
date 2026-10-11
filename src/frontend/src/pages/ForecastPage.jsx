import PredictionCard from '../components/PredictionCard';
import AIExplainer from '../components/AIExplainer';

export default function ForecastPage({ prediction, loading, onPredict }) {
  return (
    <div className="animate-fade-in mx-auto max-w-2xl space-y-10 pb-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold">AI Financial Consultant</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Proyeksi cerdas pengeluaran bulananmu berbasis riwayat transaksi.
        </p>
      </div>
      <PredictionCard onPredict={onPredict} prediction={prediction} loading={loading} />
      <div>
        <h3 className="mb-5 text-center text-lg font-semibold">Pertanyaan Umum</h3>
        <AIExplainer />
      </div>
    </div>
  );
}
