import type { Test } from '@/lib/types';
import type { LabDisplaySettings } from '@/lib/settings-schema';

export type CategoryOption = {
  id: string;
  name: string;
  rank: number;
  icon?: string | null;
  parentId?: string | null;
};

export type TestWithInventory = Test & {
  _count?: {
    inventoryRules: number;
  };
};

export type InventoryItemOption = {
  id: string;
  name: string;
  kind: string;
  unit: string;
  category: string;
  currentStock: number;
};

export type InventoryRule = {
  id: string;
  quantityPerTest: number;
  isActive: boolean;
  item: InventoryItemOption & { isActive: boolean };
};

export type TestFormState = {
  code: string;
  name: string;
  unit: string;
  minValue: string;
  maxValue: string;
  minValueM: string;
  maxValueM: string;
  minValueF: string;
  maxValueF: string;
  decimals: string;
  resultType: string;
  categoryId: string;
  parentId: string;
  options: string;
  isGroup: boolean;
  sampleType: string;
  price: string;
};

export type InventoryFormState = {
  itemId: string;
  quantityPerTest: string;
};

export type TestsLabSettings = LabDisplaySettings;

export const DEFAULT_TESTS_LAB_SETTINGS: TestsLabSettings = {
  sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
  clinical_units: 'g/L, mg/L, µg/L, mmol/L, µmol/L, nmol/L, U/L, %, Ratio, Log',
  amount_unit: 'DA',
};

export const EMPTY_TEST_FORM: TestFormState = {
  code: '',
  name: '',
  unit: '',
  minValue: '',
  maxValue: '',
  minValueM: '',
  maxValueM: '',
  minValueF: '',
  maxValueF: '',
  decimals: '1',
  resultType: 'numeric',
  categoryId: '',
  parentId: '',
  options: '',
  isGroup: false,
  sampleType: '',
  price: '0',
};

export const EMPTY_INVENTORY_FORM: InventoryFormState = {
  itemId: '',
  quantityPerTest: '',
};

export const RESULT_TYPES = [
  { value: 'numeric', label: 'Numérique' },
  { value: 'text', label: 'Texte court' },
  { value: 'long_text', label: 'Texte long' },
  { value: 'dropdown', label: 'Liste' },
] as const;
