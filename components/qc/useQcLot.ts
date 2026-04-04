import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export interface LotDetails {
  id: string;
  lotNumber: string;
  test: {
    id: string;
    code: string;
    name: string;
  };
  level: string | null;
  targetMean: number;
  targetSd: number;
  expirationDate: string;
  isActive: boolean;
  points: QcPoint[];
  dailyAverages?: DailyAverage[];
}

export interface QcPoint {
  id: string;
  value: number;
  createdAt: string;
  isValid: boolean;
  cancelMotive: string | null;
  operator: { id: string; name: string } | null;
}

export interface DailyAverage {
  date: string;
  mean: number;
  count: number;
  points: QcPoint[];
}

export function useQcLot(lotId: string) {
  const router = useRouter();
  
  const [lot, setLot] = useState<LotDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{type: 'success'|'error', message: string} | null>(null);

  const [cancelState, setCancelState] = useState<{
    isOpen: boolean;
    targetId: string | null;
    motive: string;
  }>({
    isOpen: false,
    targetId: null,
    motive: '',
  });
  const [savingCancel, setSavingCancel] = useState(false);
  const [activeTargetId, setActiveTargetId] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<Record<string, string>>({
    lab_name: 'NexLab CSSB',
  });

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadLot = useCallback(async () => {
    if (!lotId) return;
    try {
      const response = await fetch(`/api/qc/lots/${lotId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      const data = await response.json();
      setLot(data);
    } catch {
      showNotification('error', 'Impossible de charger les données du lot');
    } finally {
      setLoading(false);
    }
  }, [lotId, showNotification]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.lab_name) {
          setSettings({ lab_name: data.lab_name });
        }
      }
    } catch (e) {
      console.error('Settings load error:', e);
    }
  }, []);

  useEffect(() => {
    loadLot();
    loadSettings();
  }, [loadLot, loadSettings]);

  const grouped = useMemo(() => {
    if (!lot?.dailyAverages) return { activeArray: [], pointsMap: new Map() };
    
    const activeArray = [...lot.dailyAverages].reverse();
    const pointsMap = new Map();
    
    activeArray.forEach((day, index) => {
      pointsMap.set(index, day.points.filter(p => p.isValid));
    });
    
    return { activeArray, pointsMap };
  }, [lot?.dailyAverages]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleToggleValid = (point: QcPoint) => {
    if (point.isValid) {
      setCancelState({
        isOpen: true,
        targetId: point.id,
        motive: ''
      });
    } else {
      setActiveTargetId(point.id);
      submitInvalidate(point.id, true, null);
    }
  };

  const submitInvalidate = async (pointId: string, isValid: boolean, cancelMotive: string | null) => {
    setSavingCancel(true);
    try {
      const url = `/api/qc/points/${pointId}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isValid, cancelMotive }),
      });
      if (!response.ok) throw new Error();
      await loadLot();
      showNotification('success', isValid ? 'Point réactivé' : 'Point invalidé');
      setCancelState({ isOpen: false, targetId: null, motive: '' });
    } catch {
      showNotification('error', 'Erreur lors de l\'opération');
    } finally {
      setSavingCancel(false);
      setActiveTargetId(null);
    }
  };

  const handleConfirmCancel = () => {
    if (cancelState.targetId) {
      submitInvalidate(cancelState.targetId, false, cancelState.motive);
    }
  };

  const closeCancelModal = () => {
    setCancelState({ isOpen: false, targetId: null, motive: '' });
  };

  const setMotive = (motive: string) => {
    setCancelState(prev => ({ ...prev, motive }));
  };

  return {
    router,
    lot,
    loading,
    notification,
    cancelState,
    savingCancel,
    activeTargetId,
    settings,
    grouped,
    handlePrint,
    handleToggleValid,
    handleConfirmCancel,
    closeCancelModal,
    setMotive,
  };
}
