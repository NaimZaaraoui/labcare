'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import { Calendar, IdCard, MapPin, Phone, Printer, UserRound } from 'lucide-react';
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
  const printRef = useRef<HTMLDivElement>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: patient ? `Carte_Patient_${patient.lastName}_${patient.firstName}` : 'Carte_Patient',
    pageStyle: `@page { size: A4 portrait; margin: 12mm; } body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }`,
  });

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

  const patientName = useMemo(() => {
    if (!patient) return '';
    return `${patient.firstName} ${patient.lastName}`.trim();
  }, [patient]);

  const memberCode = useMemo(() => {
    if (!patient) return '';
    return patient.id.slice(-8).toUpperCase();
  }, [patient]);

  const barcodeValue = useMemo(() => {
    if (!patient) return '';
    return patient.id.toUpperCase();
  }, [patient]);

  const labName = settings.lab_name || 'Laboratoire';
  const labSubtitle = settings.lab_subtitle || 'Patient Card';
  const labPhone = settings.lab_phone || '';
  const labAddress = [settings.lab_address_1, settings.lab_address_2].filter(Boolean).join(', ');

  if (loading) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-[var(--color-text-soft)]">Chargement de la carte...</div>;
  }

  if (!patient) {
    return <div className="mx-auto max-w-5xl p-6 text-sm text-rose-600">Patient introuvable.</div>;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-16">
      <section className="rounded-3xl border bg-white px-5 py-4 shadow-[0_8px_28px_rgba(15,31,51,0.06)] print:hidden">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <PageBackLink href={`/dashboard/patients/${patient.id}`} />
            <h1 className="text-xl font-semibold text-[var(--color-text)]">Carte patient</h1>
            <p className="mt-1 text-sm text-[var(--color-text-soft)]">
              Format compact a imprimer pour les visites et l&apos;identification rapide.
            </p>
          </div>

          <button onClick={handlePrint} className="btn-primary-md">
            <Printer size={16} />
            Imprimer la carte
          </button>
        </div>
      </section>

      <section className="rounded-3xl border bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_8px_24px_rgba(15,31,51,0.05)] print:border-none print:bg-white print:p-0 print:shadow-none">
        <div className="flex justify-center" ref={printRef}>
          <article className="relative h-auto w-full max-w-[540px] overflow-hidden border border-slate-200 border-dashed bg-white shadow-[0_20px_50px_rgba(15,31,51,0.12)] print:h-[58mm] print:w-[92mm] print:rounded-[4mm] print:border print:shadow-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_32%),linear-gradient(135deg,#ffffff_0%,#f8fafc_46%,#eef2ff_100%)]" />
            <div className="absolute right-[-42px] top-[-42px] h-36 w-36 rounded-full bg-indigo-500/10 blur-2xl print:h-20 print:w-20" />
            <div className="absolute left-[-30px] bottom-[-44px] h-32 w-32 rounded-full bg-sky-500/10 blur-2xl print:h-16 print:w-16" />

            <div className="relative flex h-full flex-col p-7 print:p-[3.2mm]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-slate-900 text-white shadow-sm print:h-[10mm] print:w-[10mm] print:rounded-[2mm]">
                    <IdCard size={24} className="print:h-[4mm] print:w-[4mm]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 print:text-[5px]">NexLab Card</p>
                    <h2 className="text-xl font-semibold uppercase tracking-tight text-slate-900 print:text-[10px]">
                      {labName}
                    </h2>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600 print:text-[5px]">
                      {labSubtitle}
                    </p>
                  </div>
                </div>
                <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 backdrop-blur print:px-[2mm] print:py-[0.8mm] print:text-[4.5px]">
                  {patient.gender === 'F' ? 'Femme' : patient.gender === 'M' ? 'Homme' : 'Patient'}
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4 print:mt-[1.8mm] print:gap-[2mm]">
                <div className={`flex h-20 w-20 items-center justify-center rounded-[22px] text-3xl font-semibold shadow-inner print:h-[12mm] print:w-[12mm] print:rounded-[2.5mm] print:text-[10px] ${patient.gender === 'F' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  {patient.firstName[0]}
                  {patient.lastName[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-3xl font-semibold tracking-tight text-slate-900 print:text-[11px]">
                    {patientName}
                  </h3>
                  <div className="mt-2 flex flex-wrap gap-2 print:mt-[1mm] print:gap-[1mm]">
                    <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 print:px-[1.5mm] print:py-[0.5mm] print:text-[4.8px]">
                      ID {memberCode}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-[12px] text-slate-600 print:mt-[1.5mm] print:gap-[1.2mm] print:text-[4.5px]">
                <div className="rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur print:rounded-[2mm] print:p-[1.2mm]">
                  <div className="mb-1 flex items-center gap-2 font-bold uppercase tracking-[0.16em] text-slate-400 print:mb-[0.6mm] print:gap-[0.8mm] print:text-[4px]">
                    <Calendar size={14} className="print:h-[3mm] print:w-[3mm]" />
                    Naissance
                  </div>
                  <div className="font-semibold text-slate-800">
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString('fr-FR') : 'Non renseignee'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 p-3 backdrop-blur print:rounded-[2mm] print:p-[1.2mm]">
                  <div className="mb-1 flex items-center gap-2 font-bold uppercase tracking-[0.16em] text-slate-400 print:mb-[0.6mm] print:gap-[0.8mm] print:text-[4px]">
                    <Phone size={14} className="print:h-[3mm] print:w-[3mm]" />
                    Contact
                  </div>
                  <div className="truncate font-semibold text-slate-800">{patient.phoneNumber || labPhone || 'Non renseigne'}</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-500 print:mt-[1mm] print:gap-[0.8mm] print:text-[4.1px]">
                <MapPin size={14} className="shrink-0 text-slate-400 print:h-[3mm] print:w-[3mm]" />
                <span className="truncate">{patient.address || labAddress || 'Adresse non renseignee'}</span>
              </div>

              <div className="mt-auto rounded-[22px] border border-slate-200 bg-white/90 px-4 py-3 backdrop-blur print:rounded-[2.5mm] print:px-[1.2mm] print:py-[0.9mm]">
                <div className="mb-2 flex items-center justify-between gap-3 print:mb-[0.7mm]">
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 print:gap-[0.8mm] print:text-[4px]">
                    <UserRound size={13} className="print:h-[2.6mm] print:w-[2.6mm]" />
                    Identification rapide
                  </div>
                  <div className="font-mono text-[12px] font-black tracking-[0.18em] text-indigo-700 print:text-[4.8px]">
                    {memberCode}
                  </div>
                </div>

                <Code39Barcode
                  value={barcodeValue}
                  height={44}
                  className="print:[&_svg]:h-[9mm]"
                  labelClassName="mt-1 text-center font-mono text-[9px] font-black tracking-[0.22em] text-slate-800 print:mt-[0.6mm] print:text-[4px] print:tracking-[0.1em]"
                />
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
