import { z } from 'zod';

export const createAnalysisSchema = z.object({
  dailyId: z.string().optional().nullable(),
  patientId: z.string().optional().nullable(),
  selectedPatientId: z.string().optional().nullable(),
  patientFirstName: z.string().min(1, 'Le prénom est requis'),
  patientLastName: z.string().min(1, 'Le nom est requis'),
  patientBirthDate: z.string().nullable().optional(),
  patientGender: z.enum(['M', 'F']).catch('M'),
  patientPhone: z.string().nullable().optional(),
  patientEmail: z.string().email('Email invalide').nullable().optional().or(z.literal('')),
  patientAddress: z.string().nullable().optional(),
  provenance: z.string().nullable().optional(),
  medecinPrescripteur: z.string().nullable().optional(),
  isUrgent: z.boolean().catch(false),
  globalNote: z.string().nullable().optional(),
  globalNotePlacement: z.enum(['all', 'first', 'last']).catch('all'),
  receiptNumber: z.string().nullable().optional(),
  testsIds: z.array(z.string()).min(1, 'Au moins un test doit être sélectionné'),
  insuranceProvider: z.string().nullable().optional(),
  insuranceNumber: z.string().nullable().optional(),
  insuranceCoverage: z.number().min(0).max(100).nullable().optional(),
});

export const updateResultSchema = z.object({
  id: z.string().min(1, 'ID du résultat manquant'),
  value: z.string().nullable().optional(),
  unit: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  abnormal: z.boolean().catch(false),
});

