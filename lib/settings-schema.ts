export const ALLOWED_SETTINGS_KEYS = [
  'lab_name', 'lab_subtitle', 'lab_parent',
  'lab_address_1', 'lab_address_2', 'lab_phone', 'lab_email',
  'lab_bio_name', 'lab_bio_title', 'lab_bio_onmpt',
  'lab_footer_text', 'lab_stamp_image', 'lab_bio_signature', 'tat_warn', 'tat_alert',
  'sample_types', 'clinical_units', 'amount_unit', 'qc_range_basis', 'maintenance_mode', 'maintenance_message',
  'database_backup_retention_count', 'database_recovery_retention_count', 'database_backup_external_target',
] as const;

export type SettingKey = (typeof ALLOWED_SETTINGS_KEYS)[number];

export type LabSettingsMap = Record<SettingKey, string>;

export type LabDisplaySettings = Pick<LabSettingsMap, 'sample_types' | 'clinical_units' | 'amount_unit'>;

export const DEFAULT_SETTINGS: LabSettingsMap = {
  lab_name: '',
  lab_subtitle: '',
  lab_parent: '',
  lab_address_1: '',
  lab_address_2: '',
  lab_phone: '',
  lab_email: '',
  lab_bio_name: '',
  lab_bio_title: '',
  lab_bio_onmpt: '',
  lab_footer_text: '',
  lab_stamp_image: '',
  lab_bio_signature: '',
  tat_warn: '',
  tat_alert: '',
  sample_types: 'Sang total, Sérum, Plasma, Urine, LCR, Plèvre, Ascite',
  clinical_units: 'g/L, mg/L, µg/L, mmol/L, µmol/L, nmol/L, U/L, %, Ratio, Log',
  amount_unit: 'DA',
  qc_range_basis: '',
  maintenance_mode: '',
  maintenance_message: '',
  database_backup_retention_count: '',
  database_recovery_retention_count: '',
  database_backup_external_target: '',
};

export function normalizeSettingsRecord(
  value: Partial<Record<string, string>> | null | undefined
): LabSettingsMap {
  return {
    ...DEFAULT_SETTINGS,
    ...Object.fromEntries(
      ALLOWED_SETTINGS_KEYS.map((key) => [key, value?.[key] ?? DEFAULT_SETTINGS[key]])
    ),
  } as LabSettingsMap;
}

export function toLabDisplaySettings(
  value: Partial<Record<string, string>> | null | undefined
): LabDisplaySettings {
  const normalized = normalizeSettingsRecord(value);
  return {
    sample_types: normalized.sample_types,
    clinical_units: normalized.clinical_units,
    amount_unit: normalized.amount_unit,
  };
}
