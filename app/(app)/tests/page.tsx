import { TestsList } from '@/components/tests/TestsList';

export default function TestsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Paramètres de Test</h1>
          <p className="text-slate-500 font-medium">Configuration du catalogue d&apos;analyses biologiques</p>
        </div>
        <TestsList />
      </div>
    </div>
  );
}