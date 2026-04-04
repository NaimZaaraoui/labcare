'use client';

interface InventorySummaryStatsProps {
  criticalCount: number;
  lowCount: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export function InventorySummaryStats({
  criticalCount,
  lowCount,
  expiringSoonCount,
  expiredCount,
}: InventorySummaryStatsProps) {
  const cards = [
    { label: 'Stock critique', value: criticalCount, hint: 'Articles à zéro ou indisponibles' },
    { label: 'Sous seuil', value: lowCount, hint: 'Stock faible avant rupture' },
    { label: 'Expire sous 30 j', value: expiringSoonCount, hint: 'Lots à anticiper rapidement' },
    { label: 'Déjà expirés', value: expiredCount, hint: 'À isoler ou remplacer' },
  ];

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-3xl border bg-white p-5 shadow-[0_8px_26px_rgba(15,31,51,0.05)]">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--color-text-soft)]">{card.label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-text)]">{card.value}</div>
          <div className="mt-1 text-xs text-[var(--color-text-soft)]">{card.hint}</div>
        </article>
      ))}
    </section>
  );
}
