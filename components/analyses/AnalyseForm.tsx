'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, User, Plus, Beaker, Check, Search, Activity, X, CalendarIcon, FileDigit, TestTube, Loader2 } from 'lucide-react';
import { Test } from '@/lib/types';
import { NotificationToast } from '@/components/ui/notification-toast';

export function AnalyseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [tests, setTests] = useState<Test[]>([]);
  const [bilans, setBilans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTest, setSearchTest] = useState('');
  
  const [dailyId, setDailyId] = useState(''); 
  const [receiptNumber, setReceiptNumber] = useState('');
  const [provenance, setProvenance] = useState('');
  const [medecinPrescripteur, setMedecinPrescripteur] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  
  const [patient, setPatient] = useState({
    patientFirstName: '',
    patientLastName: '',
    patientBirthDate: '',
    patientGender: 'M',
    patientPhone: '',
    patientEmail: '',
    patientAddress: ''
  });
  
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [labSettings, setLabSettings] = useState<Record<string, string>>({
    amount_unit: 'DA'
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.amount_unit) {
          setLabSettings({ amount_unit: data.amount_unit });
        }
      })
      .catch(console.error);
  }, []);

  // Patient Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) { // Changed from 3 to 2
        searchPatients();
      } else {
        setSearchResults([]);
      }
    }, 400); // Slightly faster debounce
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchPatients = async () => {
    if (!searchTerm.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/patients?query=${encodeURIComponent(searchTerm.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error('Error searching patients:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPatient = (p: any) => {
    setPatient({
        ...patient,
        patientFirstName: p.firstName,
        patientLastName: p.lastName,
        patientGender: p.gender,
        patientBirthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : '',
        patientPhone: p.phoneNumber || '',
        patientEmail: p.email || '',
        patientAddress: p.address || '',
    });
    setSelectedPatientId(p.id);
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSelection = () => {
      setPatient({
        patientFirstName: '',
        patientLastName: '',
        patientBirthDate: '',
        patientGender: 'M',
        patientPhone: '',
        patientEmail: '',
        patientAddress: '',
      });
      setSelectedPatientId(null);
  };

  useEffect(() => {
    loadData();
    if (urlPatientId) {
       fetchPatientDetails(urlPatientId);
    }
  }, [urlPatientId]);

  const fetchPatientDetails = async (id: string) => {
    try {
        const res = await fetch(`/api/patients/${id}/history`);
        if (res.ok) {
            const data = await res.json();
             setPatient({
                patientFirstName: data.firstName,
                patientLastName: data.lastName,
                patientGender: data.gender,
                patientBirthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
                patientPhone: data.phoneNumber || '',
                patientEmail: data.email || '',
                patientAddress: data.address || '',
            });
            setSelectedPatientId(data.id);
        }
    } catch(e) {
        console.error("Error loading patient", e);
    }
  };

  const loadData = async () => {
    try {
      const [resTests, resBilans] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/bilans')
      ]);
      setTests(await resTests.json());
      setBilans(await resBilans.json());
    } catch (error) {
      showNotification('error', 'Erreur chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setSelectedTests(prev => {
      const isSelecting = !prev.includes(testId);
      const childrenIds = (test as any).children?.map((c: any) => c.id) || [];
      if (isSelecting) {
        return Array.from(new Set([...prev, testId, ...childrenIds]));
      } else {
        return prev.filter(id => id !== testId && !childrenIds.includes(id));
      }
    });
  };

  const toggleBilan = (bilan: any) => {
    const bilanTestIds = bilan.tests.map((t: any) => t.id);
    const allSelected = bilanTestIds.every((id: string) => selectedTests.includes(id));

    setSelectedTests(prev => {
      if (allSelected) {
        return prev.filter(id => !bilanTestIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...bilanTestIds]));
      }
    });
  };

  const filteredTests = tests.filter(test =>
    test.code.toLowerCase().includes(searchTest.toLowerCase()) ||
    test.name.toLowerCase().includes(searchTest.toLowerCase())
  );

  const groupedTests = filteredTests.reduce((acc, test) => {
    const category = test.category || 'Autres';
    if (!acc[category]) acc[category] = [];
    acc[category].push(test);
    return acc;
  }, {} as Record<string, Test[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!dailyId) {
      showNotification('error', 'Le numéro de paillasse est requis');
      return;
    }
    if (selectedTests.length === 0) {
      showNotification('error', 'Sélectionnez au moins un test');
      return;
    }
    if (!patient.patientFirstName || !patient.patientLastName) {
      showNotification('error', 'Le nom et prénom du patient sont requis');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId, // FIXED: Send the Patient.id or null
          dailyId,                      // Send the paillasse number
          ...patient,
          receiptNumber,
          provenance,
          medecinPrescripteur,
          isUrgent,
          testsIds: selectedTests
        })
      });

      if (!response.ok) throw new Error();
      const analysis = await response.json();
      router.push(`/analyses/${analysis.id}`);
    } catch (error) {
      showNotification('error', 'Erreur lors de la création');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
         <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in relative pb-24 lg:pb-0 max-w-4xl mx-auto w-full">
      
      {/* LEFT COLUMN: Patient & Order Info (High Density) */}
      <div className="w-full flex flex-col gap-6">
         <div className="bento-panel flex flex-col gap-5 p-8 lg:p-10">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <FileDigit size={16} />
               </div>
               <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Dossier / Paillasse</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">N° Paillasse *</label>
                  <input
                     value={dailyId}
                     onChange={(e) => setDailyId(e.target.value)}
                     placeholder="Ex: 54"
                     className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 px-4 h-12 rounded-xl text-lg font-black text-indigo-600 transition-all text-center placeholder:text-slate-300 outline-none"
                     required
                     autoFocus
                  />
               </div>
               <div className="space-y-1.5 col-span-2 sm:col-span-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quittance</label>
                  <input
                     value={receiptNumber}
                     onChange={(e) => setReceiptNumber(e.target.value)}
                     placeholder="Optionnel"
                     className="input-premium h-12 text-center"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provenance</label>
                  <select
                     value={provenance}
                     onChange={(e) => setProvenance(e.target.value)}
                     className="input-premium h-10 text-xs"
                  >
                     <option value="">-- Non spécifié --</option>
                     <option value="consultation">Consultation</option>
                     <option value="externe">Externe</option>
                     <option value="interne">Interne</option>
                     <option value="urgence">Urgence</option>
                     <option value="medecin_traitant">Médecin traitant</option>
                     <option value="maternite">Maternité</option>
                     <option value="chirurgie">Chirurgie</option>
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Médecin Prescripteur</label>
                  <input
                     value={medecinPrescripteur}
                     onChange={(e) => setMedecinPrescripteur(e.target.value)}
                     placeholder="Dr. Nom Prénom"
                     className="input-premium h-10 text-xs"
                  />
               </div>
            </div>

            <div className="space-y-1.5 pt-4 border-t border-slate-50">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Urgence</label>
               <div className="grid grid-cols-2 gap-2">
                  <button
                     type="button"
                     onClick={() => setIsUrgent(false)}
                     className={`h-10 rounded-xl text-xs font-bold transition-all border ${
                       !isUrgent
                         ? 'bg-slate-100 border-slate-300 text-slate-700'
                         : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                     }`}
                  >
                     Non urgent
                  </button>
                  <button
                     type="button"
                     onClick={() => setIsUrgent(true)}
                     className={`h-10 rounded-xl text-xs font-bold transition-all border ${
                       isUrgent
                         ? 'bg-rose-50 border-rose-200 text-rose-700'
                         : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                     }`}
                  >
                     Urgent
                  </button>
               </div>
            </div>
         </div>

         <div className="bento-panel flex flex-col gap-5 flex-1 p-8 lg:p-10">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
               <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <User size={16} />
               </div>
               <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Patient</h2>
            </div>

            {/* Smart Search */}
            <div className="relative z-50">
              <div className="relative flex items-center gap-2 w-full sm:max-w-xs group bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all input-premium">
            
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  )}
                  <input
                     placeholder="Chercher un patient existant ..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full bg-slate-50 h-10 pr-4 text-sm outline-none font-medium"
                     disabled={!!selectedPatientId}
                  />
                  {selectedPatientId && (
                     <button 
                         onClick={clearSelection}
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 rounded-md hover:bg-slate-200 text-slate-500 transition-colors"
                         title="Effacer la sélection"
                     >
                         <X size={14} />
                     </button>
                  )}
               </div>

               {/* Dropdown */}
               {searchResults.length > 0 && !selectedPatientId && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 max-h-60 overflow-y-auto z-50 p-1.5">
                     {searchResults.map(p => (
                         <button
                             key={p.id}
                             type="button"
                             onClick={() => selectPatient(p)}
                             className="w-full text-left p-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between group"
                         >
                             <div>
                                 <span className="font-bold text-sm text-slate-700 block">{p.lastName} {p.firstName}</span>
                                 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium mt-0.5">
                                   <span>{p.birthDate ? new Date(p.birthDate).toLocaleDateString() : 'Age inconnu'}</span>
                                   {p.phoneNumber && <span>• {p.phoneNumber}</span>}
                                 </div>
                             </div>
                             <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500">
                                <Plus size={14} />
                             </div>
                         </button>
                     ))}
                  </div>
               )}
            </div>

            {/* Form Fields */}
            <div className={`space-y-4 transition-all duration-300 ${selectedPatientId ? 'opacity-80' : ''}`}>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nom *</label>
                     <input
                        value={patient.patientLastName}
                        onChange={(e) => setPatient({...patient, patientLastName: e.target.value.toUpperCase()})}
                        className={`input-premium h-10 font-bold ${selectedPatientId ? 'bg-slate-100/50' : ''}`}
                        readOnly={!!selectedPatientId}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prénom *</label>
                     <input
                        value={patient.patientFirstName}
                        onChange={(e) => setPatient({...patient, patientFirstName: e.target.value.toUpperCase()})}
                        className={`input-premium h-10 font-bold ${selectedPatientId ? 'bg-slate-100/50' : ''}`}
                        readOnly={!!selectedPatientId}
                     />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sexe *</label>
                     <div className="flex gap-2">
                        <button
                           type="button"
                           disabled={!!selectedPatientId}
                           onClick={() => setPatient({...patient, patientGender: 'M'})}
                           className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all border ${
                              patient.patientGender === 'M'
                                 ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                 : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                           } ${selectedPatientId ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >M</button>
                        <button
                           type="button"
                           disabled={!!selectedPatientId}
                           onClick={() => setPatient({...patient, patientGender: 'F'})}
                           className={`flex-1 h-10 rounded-xl text-xs font-bold transition-all border ${
                              patient.patientGender === 'F'
                                 ? 'bg-rose-50 border-rose-200 text-rose-700'
                                 : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                           } ${selectedPatientId ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >F</button>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date  Naissance</label>
                     <input
                        type="date"
                        value={patient.patientBirthDate}
                        onChange={(e) => setPatient({...patient, patientBirthDate: e.target.value})}
                        className={`input-premium h-10 text-xs ${selectedPatientId ? 'bg-slate-100/50' : ''}`}
                        readOnly={!!selectedPatientId}
                     />
                  </div>
               </div>

               {!selectedPatientId && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-50">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Téléphone</label>
                        <input
                           value={patient.patientPhone}
                           onChange={(e) => setPatient({...patient, patientPhone: e.target.value})}
                           className="input-premium h-10 text-xs"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                        <input
                           type="email"
                           value={patient.patientEmail}
                           onChange={(e) => setPatient({...patient, patientEmail: e.target.value})}
                           className="input-premium h-10 text-xs"
                        />
                     </div>
                  </div>
               )}
            </div>
         </div>
      </div>

      {/* RIGHT COLUMN: Tests & Bilans (High Density Grid) */}
      <div className="w-full flex flex-col gap-6">
         <div className="bento-panel flex flex-col h-full p-8 lg:p-10">
            
            <div className="flex flex-col gap-4 justify-between items-start mb-6 mr-4">
               <div className="flex items-center gap-2 w-full sm:max-w-xs group bg-slate-50 border border-slate-200 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all input-premium">
                  <Search className="w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input
                     placeholder="Chercher analyse..."
                     value={searchTest}
                     onChange={(e) => setSearchTest(e.target.value)}
                     className="w-full bg-slate-50 h-10 pr-4 text-sm outline-none font-medium"
                  />
               </div>
               
               <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
                  {bilans.map(bilan => {
                     const bilanTestIds = bilan.tests.map((t: any) => t.id);
                     const isSelected = bilanTestIds.length > 0 && bilanTestIds.every((id: string) => selectedTests.includes(id));
                     return (
                        <button
                           key={bilan.id}
                           type="button"
                           onClick={() => toggleBilan(bilan)}
                           className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-all rounded-xl border flex items-center gap-1.5 ${
                              isSelected
                                 ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                                 : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                           }`}
                        >

                           {bilan.name}
                        </button>
                     );
                  })}
               </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px] lg:max-h-[600px] pr-4 custom-scrollbar space-y-8">
               {Object.entries(groupedTests).map(([category, categoryTests]) => (
                  <div key={category} className="space-y-3">
                     <div className="flex items-center gap-3 sticky top-0 bg-white/95 backdrop-blur-sm py-2 z-10 block">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category}</h3>
                        <div className="h-px flex-1 bg-slate-100" />
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                        {categoryTests.map((test) => {
                           const isSelected = selectedTests.includes(test.id);
                           const isChild = !!test.parentId;
                           return (
                              <button
                                 key={test.id}
                                 type="button"
                                 onClick={() => toggleTest(test.id)}
                                 className={`group text-left px-3 py-2.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-center ${
                                    isSelected
                                       ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                                       : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                                 } ${isChild ? 'ml-4 opacity-80 border-dashed' : ''}`}
                              >
                                 <div className="flex items-start justify-between gap-2">
                                    <div className="flex flex-col">
                                       <span className={`text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                          {test.code}
                                       </span>
                                       <span className={`text-xs font-bold leading-tight mt-0.5 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                          {test.name}
                                       </span>
                                    </div>
                                    <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                                       isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-slate-50 group-hover:border-indigo-300'
                                    }`}>
                                       {isSelected && <Check size={10} strokeWidth={4} />}
                                    </div>
                                 </div>
                              </button>
                           );
                        })}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      {/* STICKY BOTTOM ACTION BAR */}
      <div className="fixed bottom-0 lg:bottom-6 left-0 right-0 lg:left-[280px] z-50 px-4 lg:px-8 pointer-events-none shadow-lg">
         <div className="max-w-4xl mx-auto flex justify-end">
            <div className="bento-panel py-3 px-4 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex items-center gap-6 pointer-events-auto w-full sm:w-auto border border-slate-200/50 bg-white/90 backdrop-blur-xl">
               <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sélection</span>
                     <span className="text-sm font-black text-slate-900">{selectedTests.length} examen(s)</span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-slate-100" />
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Total à payer</span>
                     <span className="text-xl font-black text-indigo-600 tracking-tighter">
                        {tests
                          .filter(t => selectedTests.includes(t.id))
                          .reduce((sum, t) => sum + (t.price || 0), 0)
                          .toLocaleString()} <span className="text-[10px]">{labSettings.amount_unit}</span>
                     </span>
                  </div>
                  <div className="hidden sm:block w-px h-8 bg-slate-100" />
                  <div>
                    <span className={`status-pill ${isUrgent ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {isUrgent ? 'Urgent' : 'Routine'}
                    </span>
                  </div>
               </div>
               
               <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button 
                     onClick={() => router.back()} 
                     className="btn-secondary h-12"
                  >
                     Annuler
                  </button>
                  
                  <button 
                     onClick={handleSubmit}
                     disabled={submitting || selectedTests.length === 0} 
                     className="btn-primary h-12 shadow-indigo-500/30 shadow-lg flex-1 sm:flex-none px-8"
                  >
                     {submitting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                     ) : (
                        <><Save size={18} /> <span className="inline">Valider & Créer</span></>
                     )}
                  </button>
               </div>
            </div>
         </div>
      </div>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}