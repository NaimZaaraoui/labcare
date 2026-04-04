'use client';

import {
  CalendarCheck,
  Clock,
  Plus,
} from 'lucide-react';
import { NotificationToast } from '@/components/ui/notification-toast';
import { PageBackLink } from '@/components/ui/PageBackLink';
import { InstrumentFormModal } from '@/components/temperature/InstrumentFormModal';
import { InstrumentCard } from '@/components/temperature/InstrumentCard';
import { RecordReadingModal } from '@/components/temperature/RecordReadingModal';
import { useTemperature } from '@/components/temperature/useTemperature';

export default function TemperatureDashboardPage() {
  const state = useTemperature();

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-accent)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1500px] space-y-6 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)]">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <PageBackLink href="/" />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Suivi des températures</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {state.canManage && (
              <div className="input-premium flex h-10 items-center gap-2 px-3">
                <input
                  value={state.searchQuery}
                  onChange={(event) => state.setSearchQuery(event.target.value)}
                  placeholder="Rechercher instrument..."
                  className="w-44 border-none bg-transparent text-sm outline-none"
                />
              </div>
            )}
            {state.canManage && (
              <select
                value={state.statusFilter}
                onChange={(event) => state.setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')}
                className="input-premium h-10 px-3 text-sm"
              >
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            )}
            <button onClick={state.loadInstruments} className="btn-secondary-sm">
              <Clock size={16} />
              Actualiser
            </button>
            {state.canManage && (
              <button onClick={() => state.setShowCreate(true)} className="btn-primary-sm">
                <Plus size={16} />
                Ajouter un instrument
              </button>
            )}
          </div>
        </div>
      </section>

      {(state.summary.alertCount > 0 || state.summary.missingCount > 0) && (
        <section className={`rounded-3xl px-5 py-4 shadow-[0_8px_22px_rgba(40,120,180,0.08)] ${
          state.summary.alertCount > 0 ? 'border border-rose-200/70 bg-rose-50/85' : 'border border-amber-200/70 bg-amber-50/85'
        }`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className={`text-sm font-semibold uppercase tracking-[0.12em] ${
                state.summary.alertCount > 0 ? 'text-rose-800' : 'text-amber-800'
              }`}>
                Suivi quotidien
              </h2>
              <p className={`mt-1 text-sm ${
                state.summary.alertCount > 0 ? 'text-rose-900' : 'text-amber-900'
              }`}>
                {state.summary.missingCount} instrument{state.summary.missingCount > 1 ? 's' : ''} avec relevé manquant · {state.summary.alertCount} alerte{state.summary.alertCount > 1 ? 's' : ''} hors plage
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-soft)]">
              <CalendarCheck className="h-4 w-4" />
              Checklist quotidienne
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {state.loading && (
          <div className="col-span-full rounded-3xl border bg-white px-5 py-12 text-center text-sm text-[var(--color-text-soft)]">
            Chargement des instruments...
          </div>
        )}

        {!state.loading && state.instruments.length === 0 && (
          <div className="col-span-full rounded-3xl border bg-white px-5 py-12 text-center text-sm text-[var(--color-text-soft)]">
            Aucun instrument ne correspond aux filtres actuels.
          </div>
        )}

        {!state.loading &&
          state.instruments.map((instrument) => (
            <InstrumentCard
              key={instrument.id}
              instrument={instrument}
              canManage={state.canManage}
              onOpenRecord={state.openRecordModal}
              onOpenHistory={(instrumentId) => state.router.push(`/dashboard/temperature/${instrumentId}`)}
              onOpenEdit={state.openEditModal}
              onPrint={(instrumentId) =>
                state.printUrl(`/dashboard/temperature/${instrumentId}/print?month=${new Date().toISOString().slice(0, 7)}`)
              }
            />
          ))}
      </section>

      <RecordReadingModal
        open={state.showRecord}
        instrument={state.selectedInstrument}
        selectedPeriod={state.selectedPeriod}
        recordValue={state.recordValue}
        correctiveAction={state.correctiveAction}
        submitting={state.submitting}
        onClose={() => state.setShowRecord(false)}
        onSubmit={state.submitReading}
        onRecordValueChange={state.setRecordValue}
        onCorrectiveActionChange={state.setCorrectiveAction}
      />

      <InstrumentFormModal
        open={state.showCreate && state.canManage}
        title="Nouvel instrument"
        subtitle="Refrigerateur, congelateur, incubateur..."
        submitLabel="Creer"
        payload={state.createPayload}
        customType={state.customCreateType}
        submitting={state.creating}
        onClose={() => state.setShowCreate(false)}
        onSubmit={state.submitInstrument}
        onPayloadChange={state.setCreatePayload}
        onCustomTypeChange={state.setCustomCreateType}
      />

      <InstrumentFormModal
        open={state.showEdit && Boolean(state.editingInstrument) && state.canManage}
        title="Modifier l'instrument"
        subtitle={state.editingInstrument?.name || ''}
        submitLabel="Enregistrer"
        payload={state.editPayload}
        customType={state.customEditType}
        submitting={state.savingInstrument}
        onClose={() => state.setShowEdit(false)}
        onSubmit={state.submitInstrumentUpdate}
        onPayloadChange={state.setEditPayload}
        onCustomTypeChange={state.setCustomEditType}
      />

      {state.notification && <NotificationToast type={state.notification.type} message={state.notification.message} />}
    </div>
  );
}
