'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Calendar, IdCard, MapPin, Phone, Printer, UserRound, LucideMicroscope, ShieldCheck, Mail } from 'lucide-react';
import { Code39Barcode } from '@/components/print/Code39Barcode';
import { PageBackLink } from '@/components/ui/PageBackLink';

type PatientAnalysis = {
  id: string;
};

type PatientData = {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  analyses: PatientAnalysis[];
};

export default function PatientCardPrintPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const autoPrint = searchParams.get('autoprint') === '1';

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [patientResponse, settingsResponse] = await Promise.all([
          fetch(`/api/patients/${id}/history`),
          fetch('/api/settings'),
        ]);

        if (!mounted) return;

        if (patientResponse.ok) {
          setPatient(await patientResponse.json());
        }

        if (settingsResponse.ok) {
          setSettings(await settingsResponse.json());
        }
      } finally {
        if (mounted) {
          setLoading(false);
          window.setTimeout(() => setReady(true), 250);
        }
      }
    };

    if (id) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!ready || !autoPrint) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [autoPrint, ready]);

  const patientName = useMemo(() => {
    if (!patient) return '';
    return `${patient.firstName} ${patient.lastName}`.trim();
  }, [patient]);

  const memberCode = useMemo(() => {
    if (!patient) return '';
    // Use last 8 chars for a clean display code
    return patient.id.slice(-8).toUpperCase();
  }, [patient]);

  const labName = settings.lab_name || 'NexLab';
  const labSubtitle = settings.lab_subtitle || 'Centre de Santé';

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-sm font-medium text-[var(--color-text-soft)] animate-pulse">Chargement de la carte patient...</div>;
  }

  if (!patient) {
    return <div className="flex h-screen items-center justify-center text-sm font-bold text-rose-500">Patient introuvable.</div>;
  }

  return (
    <div className="min-h-screen bg-[#f3f6f9] py-12 px-4 selection:bg-[var(--color-accent)] selection:text-white print:p-0 print:bg-white">
      
      {/* Interactive Controls (Hidden on Print) */}
      <section className="mx-auto max-w-2xl mb-12 animate-fade-in print:hidden">
        <div className="bg-white rounded-3xl border border-[var(--color-border)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <PageBackLink href={`/dashboard/patients/${patient.id}`} />
            <h1 className="text-2xl font-black text-[var(--color-text)] tracking-tight">Carte d&apos;Identification</h1>
            <p className="text-sm font-medium text-[var(--color-text-soft)]">Format portefeuile standard (86x54mm) pour archivage et identification.</p>
          </div>
          <button 
            onClick={() => window.print()} 
            className="group btn-primary h-14 px-8 rounded-2xl shadow-[0_10px_20px_rgba(31,95,191,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Printer size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="font-bold">Lancer l&apos;impression</span>
          </button>
        </div>
      </section>

      {/* Main Card Rendering Area */}
      <div className="flex justify-center flex-col items-center gap-12">
        <article id="patient-id-card" className="relative h-auto w-full max-w-[540px] overflow-hidden bg-white shadow-[0_40px_80px_rgba(15,31,51,0.12)] border border-[var(--color-border)] ring-1 ring-slate-900/5 print:border-none print:shadow-none print:w-[85.6mm] print:rounded-none print:m-0">
          
          {/* Aesthetic Background Layers */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(31,95,191,0.08),transparent_40%),linear-gradient(135deg,#ffffff_0%,#f8fafc_60%,#eff6ff_100%)]" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-accent)]/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -translate-x-1/2 translate-y-1/2" />
          
          {/* Zebra Stripe Pattern (Very Subtle) */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_20px,#000_20px,#000_21px)]" />

          {/* Card Content Shell */}
          <div className="relative h-full flex flex-col p-8 print:p-[3mm]">
            
            {/* Header: Lab Identity */}
            <header className="flex items-start justify-between mb-8 print:mb-[2mm]">
              <div className="flex items-center gap-4 print:gap-[2mm]">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg print:w-[8mm] print:h-[8mm] print:rounded-[1.5mm]">
                  <LucideMicroscope size={28} className="print:w-[4.5mm] print:h-[4.5mm]" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight leading-none print:text-[10pt]">{labName}</h2>
                  <div className="flex items-center gap-2 mt-1 print:mt-[0.5mm]">
                    <div className="h-[2px] w-4 bg-[var(--color-accent)] print:w-[2mm] print:h-[0.3mm]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-soft)] print:text-[4.5pt]">{labSubtitle}</span>
                  </div>
                </div>
              </div>
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest print:px-[2mm] print:py-[0.5mm] print:text-[4pt] ${patient.gender === 'F' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                {patient.gender === 'F' ? 'Patiente' : 'Patient'}
              </div>
            </header>

            {/* Body: Patient Identity */}
            <main className="flex items-center gap-6 print:gap-[3mm] mb-6 print:mb-[2mm]">
               <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-black shadow-inner print:w-[14mm] print:h-[14mm] print:rounded-[2.5mm] print:text-[14pt] ${patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  {patient.firstName[0]}{patient.lastName[0]}
               </div>
               <div className="min-w-0">
                 <h3 className="text-3xl font-black tracking-tighter text-[var(--color-text)] leading-none truncate print:text-[12pt]">{patientName}</h3>
                 <div className="flex items-center gap-2 mt-3 print:mt-[1mm]">
                   <span className="text-[10px] font-bold text-[var(--color-text-soft)] uppercase tracking-widest print:text-[4.5pt]">Dossier médical :</span>
                   <span className="font-mono font-black text-[var(--color-accent)] text-lg print:text-[7pt]">{memberCode}</span>
                 </div>
               </div>
            </main>

            {/* Footer Data Grid */}
            <div className="grid grid-cols-2 gap-4 mt-auto mb-4 print:gap-[2mm] print:mb-[1.5mm]">
               <div className="bg-[var(--color-surface-muted)]/50 border border-white rounded-2xl p-4 print:p-[1.5mm] print:rounded-[1.5mm]">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-[3.5pt]">
                    <Calendar size={12} className="print:w-[2.5mm]" /> Naissance
                  </div>
                  <div className="text-sm font-bold text-[var(--color-text)] print:text-[6pt]">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  </div>
               </div>
               <div className="bg-[var(--color-surface-muted)]/50 border border-white rounded-2xl p-4 print:p-[1.5mm] print:rounded-[1.5mm]">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 print:text-[3.5pt]">
                    <Phone size={12} className="print:w-[2.5mm]" /> Téléphone
                  </div>
                  <div className="text-sm font-bold text-[var(--color-text)] print:text-[6pt]">
                    {patient.phoneNumber || '—'}
                  </div>
               </div>
               {/* Email Field Added */}
               <div className="col-span-2 bg-[var(--color-surface-muted)]/50 border border-white rounded-2xl px-4 py-3 print:p-[1.2mm] print:rounded-[1.5mm]">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 print:text-[3.5pt]">
                    <Mail size={12} className="print:w-[2.5mm]" /> Email
                  </div>
                  <div className="text-sm font-bold text-[var(--color-text)] truncate print:text-[5.5pt]">
                    {patient.email || '—'}
                  </div>
               </div>
            </div>

            {/* Barcode & Security info */}
            <footer className="mt-auto border-t border-[var(--color-border)] pt-4 flex items-center justify-between print:pt-[1.5mm] print:border-black/5">
                <div className="flex-1 max-w-[280px] print:max-w-[45mm]">
                  <Code39Barcode 
                    value={memberCode} 
                    height={44} 
                    className="print:[&_svg]:h-[8mm]"
                    labelClassName="mt-1 font-mono text-[8px] font-bold text-center tracking-[0.2em] text-[var(--color-text-soft)] print:text-[3.5pt]"
                  />
                </div>
                <div className="flex flex-col items-end shrink-0">
                   <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase tracking-widest print:text-[3.5pt]">
                      <ShieldCheck size={12} className="print:w-[2.5mm]" /> Identité Vérifiée
                   </div>
                   <p className="text-[8px] font-medium text-[var(--color-text-soft)] mt-1 print:text-[2.5pt]">Usage clinique exclusif</p>
                </div>
            </footer>

          </div>
        </article>

        {/* Printing usage info */}
        <div className="text-center space-y-2 animate-fade-in print:hidden">
          <p className="text-sm font-semibold text-[var(--color-text-soft)]">Conseil d&apos;impression : Utilisez du papier cartonné ou plastifiez après impression.</p>
          <div className="flex items-center justify-center gap-4 text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Format Correct</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Typo HQ</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-900" /> Barcode Scan OK</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: 85.6mm 53.98mm;
            margin: 0;
          }
          body {
            background: white !important;
            margin: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html {
             background: white !important;
          }
        }
      `}</style>
    </div>
  );
}
