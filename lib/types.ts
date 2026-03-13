export interface Test {
    id: string;
    name: string;
    code: string;
    unit: string | null;
    minValue: number | null;
    maxValue: number | null;
    minValueM: number | null;
    maxValueM: number | null;
    minValueF: number | null;
    maxValueF: number | null;
    decimals: number;
    resultType: string;
    category: string | null;
    options: string | null;
    isGroup: boolean;
    rank: number;
    categoryRel?: { id: string; name: string; rank: number };
    parentId: string | null;
    parent?: Test;
    children?: Test[];
    createdAt: Date;
    updatedAt: Date;
}


export interface Analysis {
  id: string;
  orderNumber: string;
  receiptNumber: string | null;
  dailyId: string | null;
  patientId: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientAge: number | null;
  patientGender: string | null;
  creationDate: Date;
  drawingDate: Date | null;
  status: string | null;
  printedAt: Date | null;
  histogramData: string | null;
  previousResults?: Record<string, string>;
  patient?: Patient;
  results: Result[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Result {
  id: string;
  analysisId: string;
  testId: string;
  test?: Test;
  value: string | null;
  unit: string | null;
  notes: string | null;
  abnormal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTestInput = {
  name: string;
  code: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
  resultType?: string;
  category?: string;
  isGroup?: boolean;
  parentId?: string;
  options?: string;
};

export type CreateAnalysisInput = {
  patientId: string;
  patientFirstName?: string;
  patientLastName?: string;
  patientAge?: number;
  patientGender?: string;
  testsIds: string[];
};

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
  gender: string;
  phoneNumber: string | null;
  email: string | null;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}