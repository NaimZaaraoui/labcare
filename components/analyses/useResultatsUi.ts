import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from 'react';
import type { ResultWithRenderCategory, AnalysisInputsMap } from './types';

interface UseResultatsUiOptions {
  analysisId: string;
  selectedIds: string[];
  sortedResults: ResultWithRenderCategory[];
  inputsRef: MutableRefObject<AnalysisInputsMap>;
  setSelectedTestIds: Dispatch<SetStateAction<string[]>>;
}

export function useResultatsUi({
  analysisId,
  selectedIds,
  sortedResults,
  inputsRef,
  setSelectedTestIds,
}: UseResultatsUiOptions) {
  const formatValue = useCallback((value: string, decimals: number = 1): string => {
    if (!value) return '';
    const num = parseFloat(value.replace(',', '.'));
    if (isNaN(num)) return value;
    return num.toFixed(decimals).replace('.', ',');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number, total: number) => {
    if (e.key !== 'Enter') return;

    e.preventDefault();
    let nextIndex = (index + 1) % total;
    let steps = 0;

    while (steps < total && sortedResults[nextIndex]?.test?.isGroup) {
      nextIndex = (nextIndex + 1) % total;
      steps += 1;
    }

    const nextId = sortedResults[nextIndex]?.id;
    if (nextId && inputsRef.current[nextId]) {
      inputsRef.current[nextId]?.focus();
    }
  }, [inputsRef, sortedResults]);

  const toggleSelectedTest = useCallback((testId: string) => {
    setSelectedTestIds((prev) => (
      prev.includes(testId) ? prev.filter((id) => id !== testId) : [...prev, testId]
    ));
  }, [setSelectedTestIds]);

  const handlePrint = useCallback(() => {
    const selected = selectedIds.length > 0 ? `&selected=${selectedIds.join(',')}` : '';
    window.open(
      `/analyses/${analysisId}/export?autoprint=1&closeAfterPrint=1${selected}`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [analysisId, selectedIds]);

  const handlePrintInvoice = useCallback(() => {
    window.open(
      `/analyses/${analysisId}/invoice?autoprint=1&closeAfterPrint=1`,
      '_blank',
      'noopener,noreferrer'
    );
  }, [analysisId]);

  return {
    formatValue,
    handleKeyDown,
    toggleSelectedTest,
    handlePrint,
    handlePrintInvoice,
  };
}
