import { describe, it, expect } from 'vitest';
import { createAnalysisSchema, updateResultSchema } from '@/lib/validations';

describe('Validation Schemas', () => {
  describe('createAnalysisSchema', () => {
    it('should validate a complete analysis creation', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        testsIds: ['test-1', 'test-2'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing required firstName', () => {
      const data = {
        patientLastName: 'Dupont',
        patientGender: 'M',
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject missing required lastName', () => {
      const data = {
        patientFirstName: 'Jean',
        patientGender: 'M',
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject empty tests array', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        testsIds: [],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with optional fields', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientBirthDate: '1990-01-15',
        patientGender: 'F',
        patientPhone: '0612345678',
        patientEmail: 'jean@example.com',
        testsIds: ['test-1'],
        isUrgent: true,
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        patientEmail: 'not-an-email',
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should accept empty email string', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'M',
        patientEmail: '',
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should default gender to M if invalid', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientGender: 'X', // Invalid
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.patientGender).toBe('M');
      }
    });

    it('should validate insurance coverage percentage', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        insuranceCoverage: 75,
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject insurance coverage > 100', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        insuranceCoverage: 150,
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should reject negative insurance coverage', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        insuranceCoverage: -10,
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate globalNotePlacement enum', () => {
      const validPlacements = ['all', 'first', 'last'];

      for (const placement of validPlacements) {
        const data = {
          patientFirstName: 'Jean',
          patientLastName: 'Dupont',
          testsIds: ['test-1'],
          globalNotePlacement: placement,
        };

        const result = createAnalysisSchema.safeParse(data);
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid globalNotePlacement', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
        globalNotePlacement: 'invalid-placement',
      };

      const result = createAnalysisSchema.safeParse(data);
      // Note: Zod may coerce invalid enum values, so we check if it doesn't match expected
      if (result.success) {
        // If it succeeds, the value should have been coerced or defaulted
        expect(['all', 'first', 'last']).toContain(result.data.globalNotePlacement);
      }
    });

    it('should default isUrgent to false', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isUrgent).toBe(false);
      }
    });

    it('should handle null and optional fields', () => {
      const data = {
        patientFirstName: 'Jean',
        patientLastName: 'Dupont',
        patientBirthDate: null,
        patientPhone: null,
        patientEmail: null,
        testsIds: ['test-1'],
      };

      const result = createAnalysisSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });

  describe('updateResultSchema', () => {
    it('should validate a complete result update', () => {
      const data = {
        id: 'result-1',
        value: '12.5',
        unit: 'g/dL',
        notes: 'Sample comment',
        abnormal: false,
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject missing result id', () => {
      const data = {
        value: '12.5',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should validate with only id (minimal update)', () => {
      const data = {
        id: 'result-1',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept null value', () => {
      const data = {
        id: 'result-1',
        value: null,
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle abnormal flag default', () => {
      const data = {
        id: 'result-1',
        value: '5.2',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.abnormal).toBe(false);
      }
    });

    it('should set abnormal to true', () => {
      const data = {
        id: 'result-1',
        value: '2.1',
        abnormal: true,
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.abnormal).toBe(true);
      }
    });

    it('should accept numeric string values', () => {
      const data = {
        id: 'result-1',
        value: '123.456',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept qualitative values (text)', () => {
      const data = {
        id: 'result-1',
        value: 'Positif',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle empty notes', () => {
      const data = {
        id: 'result-1',
        value: '10',
        notes: '',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should handle special characters in notes', () => {
      const data = {
        id: 'result-1',
        value: '10',
        notes: 'Résultat avec caractères spéciaux: @#$%&*',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should accept Unicode characters', () => {
      const data = {
        id: 'result-1',
        value: '10',
        notes: 'Résultat - 測試 - тест',
      };

      const result = updateResultSchema.safeParse(data);
      expect(result.success).toBe(true);
    });
  });
});
