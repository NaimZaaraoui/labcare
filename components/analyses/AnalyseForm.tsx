'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Save, User, Plus, Beaker, ChevronRight, ChevronLeft, Check, Search, Sparkles, Activity, BadgeCheck, X, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Test } from '@/lib/types';

import { NotificationToast } from '@/components/ui/notification-toast';

export function AnalyseForm() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [bilans, setBilans] = useState<any[]>([]); // Using any for now or define interface
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [searchTest, setSearchTest] = useState('');
  
  const searchParams = useSearchParams();
  const urlPatientId = searchParams.get('patientId');

  const [dailyId, setDailyId] = useState(''); 
  const [receiptNumber, setReceiptNumber] = useState(''); // Analyis-specific field, not patient
  
    const [patient, setPatient] = useState({
      // patientId: '', // Daily ID and UUID are separated
      patientFirstName: '',
      patientLastName: '',
      patientBirthDate: '',
      patientGender: 'M',
      patientPhone: '',
      patientEmail: '',
      patientAddress: ''
      // receiptNumber removed from here
    });
  
  const [selectedTests, setSelectedTests] = useState<string[]>([]);

  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Patient Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length > 2) {
        searchPatients();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchPatients = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/patients?query=${searchTerm}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (e) {
      console.error(e);
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
        // patientId is NOT set here, as it refers to Daily ID in the UI context previously, which was wrong.
    });
    setSelectedPatientId(p.id);
    setSearchTerm('');
    setSearchResults([]);
  };

  const clearSelection = () => {
      setPatient({
        ...patient,
        patientFirstName: '',
        patientLastName: '',
        patientBirthDate: '',
        patientGender: 'M',
        patientPhone: '',
        patientEmail: '',
        patientAddress: '',
        // patientId: '' 
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
            // Pre-fill form
             setPatient(prev => ({
                ...prev,
                patientFirstName: data.firstName,
                patientLastName: data.lastName,
                patientGender: data.gender,
                patientBirthDate: data.birthDate ? new Date(data.birthDate).toISOString().split('T')[0] : '',
                patientPhone: data.phoneNumber || '',
                patientEmail: data.email || '',
                patientAddress: data.address || '',
            }));
            setSelectedPatientId(data.id);
        }
    } catch(e) {
        console.error("Error loading patient from URL", e);
    }
  };

  // Removed incorrectly placed closing braces

  const loadData = async () => {
    try {
      const [resTests, resBilans] = await Promise.all([
        fetch('/api/tests'),
        fetch('/api/bilans')
      ]);
      const testsData = await resTests.json();
      const bilansData = await resBilans.json();
      setTests(testsData);
      setBilans(bilansData);
    } catch (error) {
      console.error('Erreur:', error);
      showNotification('error', 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleTest = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    setSelectedTests(prev => {
      const isSelecting = !prev.includes(testId);
      // Logic for groups (legacy)
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
        // Deselect all
        return prev.filter(id => !bilanTestIds.includes(id));
      } else {
        // Select all
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
    
    if (step === 1) {
      if (!dailyId) { // Check dailyId instead of valid patientId since we might not have a patient selected (new patient)
         // Actually, wait, dailyId is required asterisk field.
         // Let's just check dailyId here?
      }
      setStep(2);
      return;
    }
    
    if (selectedTests.length === 0) {
      showNotification('error', 'Sélectionnez au moins un test');
      return;
    }

    setSubmitting(true);

    try {
      if (!dailyId) {
        showNotification('error', 'Le numéro de paillasse est requis');
        setSubmitting(false);
        return;
      }

      const response = await fetch('/api/analyses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: dailyId, // Send dailyId as the 'patientId' field expected by API for paillasse number
          selectedPatientId, // Pass the internal ID if retrieved from search
          patientFirstName: patient.patientFirstName,
          patientLastName: patient.patientLastName,
          patientGender: patient.patientGender,
          patientBirthDate: patient.patientBirthDate,
          patientPhone: patient.patientPhone,
          patientEmail: patient.patientEmail,
          patientAddress: patient.patientAddress,
          receiptNumber: receiptNumber,
          testsIds: selectedTests
        })
      });

      if (!response.ok) throw new Error();

      const analysis = await response.json();
      router.push(`/analyses/${analysis.id}`);
    } catch (error) {
      showNotification('error', 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse p-4">
        <div className="h-20 bg-slate-100 rounded-3xl" />
        <div className="h-96 bg-slate-100 rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in max-w-4xl mx-auto pb-20">
      {/* Header Info */}
      <div className="text-center space-y-2 px-4">
         <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Nouvelle <span className="text-blue-600">Analyse</span></h1>
         <p className="text-sm md:text-base text-slate-500 font-medium">Enregistrement d&apos;un nouveau dossier patient</p>
      </div>

      {/* Modern Stepper */}
      <div className="relative flex justify-center items-center gap-8 md:gap-12 py-4">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-slate-100 hidden md:block" />
        
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            step >= 1 ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200'
          }`}>
            {step > 1 ? <BadgeCheck size={28} /> : <User size={28} />}
          </div>
          <span className={`text-xs font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>Patient</span>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
            step >= 2 ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'bg-white text-slate-400 border border-slate-200'
          }`}>
            <Beaker size={28} />
          </div>
          <span className={`text-xs font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>Tests</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 1 && (
          <div className="bento-card-glass p-6 md:p-10 border-none shadow-premium animate-fade-in">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Activity size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Identité du Patient</h2>
                <p className="text-sm font-medium text-slate-500 italic">Veuillez remplir les informations obligatoires (*)</p>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                 {/* DAILY ID & SEARCH & QUITTANCE */}
                 <div className="md:col-span-2 space-y-6 bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Numéro de Paillasse (Daily ID) *</Label>
                            <input
                                value={dailyId}
                                onChange={(e) => setDailyId(e.target.value)}
                                placeholder="Ex: 1, 2, 3..."
                                className="input-premium h-16 text-2xl font-black text-center text-blue-600 tracking-wider"
                                required
                                autoFocus
                            />
                            <p className="text-[10px] text-center text-slate-400 font-medium">Numéro inscrit sur la tube</p>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Quittance (N° reçu)</Label>
                            <input
                                value={receiptNumber}
                                onChange={(e) => setReceiptNumber(e.target.value)}
                                placeholder="Ex: 12345"
                                className="input-premium h-16 text-xl font-bold text-center"
                            />
                            <p className="text-[10px] text-center text-slate-400 font-medium">Reçu de paiement (Optionnel: Ancien/Nouveau)</p>
                        </div>
                    </div>

                    <div className="relative z-50">
                        <Label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 block">Rechercher un Patient (Historique)</Label>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nom du patient..."
                                className="input-premium pl-12 h-14 w-full"
                                disabled={!!selectedPatientId}
                            />
                            {selectedPatientId && (
                                <button 
                                    onClick={clearSelection}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full hover:bg-slate-300 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Search Results Dropdown */}
                        {searchResults.length > 0 && !selectedPatientId && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-50 p-2">
                                {searchResults.map(p => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => selectPatient(p)}
                                        className="w-full text-left p-3 hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-between group"
                                    >
                                        <div>
                                            <span className="font-bold text-slate-700 block">{p.lastName} {p.firstName}</span>
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                              <span>{p.birthDate ? new Date(p.birthDate).toLocaleDateString() : 'Date inconnue'}</span>
                                              {p.phoneNumber && <span>• {p.phoneNumber}</span>}
                                              {p.address && <span className="truncate max-w-[150px]">• {p.address}</span>}
                                            </div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                 </div>

                 {!selectedPatientId && (
                    <div className="md:col-span-2 border-t border-slate-100 pt-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Ou Nouveau Patient</p>
                    </div>
                 )}

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Prénom</Label>
                  <input
                    value={patient.patientFirstName}
                    onChange={(e) => setPatient({...patient, patientFirstName: e.target.value})}
                    placeholder="Jean"
                    className={`input-premium h-14 font-bold ${selectedPatientId ? 'bg-slate-50 text-slate-500' : ''}`}
                    readOnly={!!selectedPatientId}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Nom</Label>
                  <input
                    value={patient.patientLastName}
                    onChange={(e) => setPatient({...patient, patientLastName: e.target.value})}
                    placeholder="DUPONT"
                    className={`input-premium h-14 font-bold ${selectedPatientId ? 'bg-slate-50 text-slate-500' : ''}`}
                    readOnly={!!selectedPatientId}
                  />
                </div>

                <div className="space-y-2">
                   <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Date de Naissance</Label>
                   <input
                     type="date"
                     value={patient.patientBirthDate}
                     onChange={(e) => setPatient({...patient, patientBirthDate: e.target.value})}
                     className={`input-premium h-14 ${selectedPatientId ? 'bg-slate-50 text-slate-500' : ''}`}
                     readOnly={!!selectedPatientId}
                   />
                </div>
              
              <div className="space-y-2">
                 <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Sexe</Label>
                 <div className="flex gap-4">
                   <button
                     type="button"
                     disabled={!!selectedPatientId}
                     onClick={() => setPatient({...patient, patientGender: 'M'})}
                     className={`flex-1 h-14 rounded-2xl font-black transition-all border-2 ${
                       patient.patientGender === 'M'
                         ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                         : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                     } ${selectedPatientId ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >Homme</button>
                   <button
                     type="button"
                     disabled={!!selectedPatientId}
                     onClick={() => setPatient({...patient, patientGender: 'F'})}
                     className={`flex-1 h-14 rounded-2xl font-black transition-all border-2 ${
                       patient.patientGender === 'F'
                         ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-200'
                         : 'bg-white border-slate-100 text-slate-400 hover:border-rose-200'
                     } ${selectedPatientId ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >Femme</button>
                 </div>
               </div>

               {/* Optional Contact Fields for New Patient */}
               {!selectedPatientId && (
                 <>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Téléphone</Label>
                      <input
                        value={patient.patientPhone}
                        onChange={(e) => setPatient({...patient, patientPhone: e.target.value})}
                        placeholder="06..."
                        className="input-premium h-14"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Email</Label>
                      <input
                        type="email"
                        value={patient.patientEmail}
                        onChange={(e) => setPatient({...patient, patientEmail: e.target.value})}
                        placeholder="email@example.com"
                        className="input-premium h-14"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Adresse</Label>
                      <input
                        value={patient.patientAddress}
                        onChange={(e) => setPatient({...patient, patientAddress: e.target.value})}
                        placeholder="Adresse complète"
                        className="input-premium h-14"
                      />
                    </div>
                 </>
               )}
               

            </div>
          </div>
        )}

        {step === 2 && (
            <div className="bento-card-glass p-10 border-none shadow-premium animate-fade-in">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Beaker size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tests Biologiques</h2>
                    <p className="text-sm font-medium text-slate-500">Sélectionnez les examens à réaliser</p>
                  </div>
                </div>
                <span className="glass-badge badge-blue">{selectedTests.length} Selectionné{selectedTests.length > 1 ? 's' : ''}</span>
              </div>

              {/* Raccourcis Bilans */}
              <div className="mb-8 p-6 bg-slate-50 rounded-[var(--radius-3xl)] border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <Sparkles size={14} className="text-blue-500" /> Raccourcis Rapides
                </h3>
                <div className="flex flex-wrap gap-3">
                   {bilans.map(bilan => {
                      const bilanTestIds = bilan.tests.map((t: any) => t.id);
                      const isSelected = bilanTestIds.length > 0 && bilanTestIds.every((id: string) => selectedTests.includes(id));
                      // Partial selection check could be added for UI nuance
                      
                      return (
                        <button
                          key={bilan.id}
                          type="button"
                          onClick={() => toggleBilan(bilan)}
                          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 flex items-center gap-2 ${
                            isSelected
                              ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                          }`}
                        >
                           {isSelected ? <Check size={16} /> : <Plus size={16} />}
                           {bilan.name}
                        </button>
                      );
                   })}
                   
                   {bilans.length === 0 && (
                      <p className="text-[11px] font-medium text-slate-400 italic">Créez des "Bilans" dans les paramètres pour voir des raccourcis ici.</p>
                   )}
                </div>
              </div>

              <div className="relative mb-8 group">

              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                placeholder="Chercher un test par nom ou code (ex: NFS, Glycémie...)"
                value={searchTest}
                onChange={(e) => setSearchTest(e.target.value)}
                className="input-premium pl-12 h-14"
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto space-y-8 pr-2 custom-scrollbar">
              {Object.entries(groupedTests).map(([category, categoryTests]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                    {category}
                    <span className="flex-1 h-px bg-slate-100" />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categoryTests.map((test) => {
                        const isSelected = selectedTests.includes(test.id);
                        const isGroup = test.isGroup;
                        const isChild = !!test.parentId;

                      
                      return (
                        <button
                          key={test.id}
                          type="button"
                          onClick={() => toggleTest(test.id)}
                          className={`group p-5 rounded-2xl border-2 text-left transition-all duration-300 relative overflow-hidden ${
                            isSelected
                              ? (isGroup ? 'bg-indigo-600 border-indigo-600 shadow-indigo-100' : 'bg-blue-600 border-blue-600 shadow-blue-100')
                              : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50'
                          } ${isChild ? 'ml-6 border-dashed opacity-90' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-2 relative z-10">
                            <div className="flex gap-2">
                               <span className={`font-mono text-[10px] font-black px-2 py-0.5 rounded-lg ${
                                 isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                               }`}>
                                 {test.code}
                               </span>
                               {isGroup && (
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg ${isSelected ? 'bg-indigo-400 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                                     BILAN ({ (test as any).children.length })
                                  </span>
                               )}
                            </div>
                            {isSelected && <Sparkles size={16} className={`${isGroup ? 'text-indigo-200' : 'text-blue-200'} animate-pulse`} />}
                          </div>
                          <p className={`font-black tracking-tight relative z-10 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{test.name}</p>
                          {test.unit && (
                            <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 relative z-10 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>{test.unit}</p>
                          )}
                          
                          {/* Hover decoration */}
                          <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-current opacity-[0.03] rounded-full transition-transform duration-500 group-hover:scale-150`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          {step === 2 ? (
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="h-16 px-8 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <ChevronLeft size={20} /> Retour
            </button>
          ) : (
            <button 
              type="button" 
              onClick={() => router.back()} 
              className="h-16 px-8 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              Annuler
            </button>
          )}
          
          <button 
            type="submit" 
            disabled={submitting} 
            className="flex-1 btn-primary-premium h-16 text-lg"
          >
            {submitting ? (
              'Enregistrement...'
            ) : step === 1 ? (
              <>Suivant <ChevronRight size={20} className="ml-2" /></>
            ) : (
              <><Save size={20} className="mr-2" /> Créer le Dossier</>
            )}
          </button>
        </div>
      </form>

      {notification && (
        <NotificationToast type={notification.type} message={notification.message} />
      )}
    </div>
  );
}