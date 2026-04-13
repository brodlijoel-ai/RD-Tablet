export interface UserSession {
  name: string;
  vehicle: string;
  qualification: 'Rettungshelfer' | 'Rettungssanitäter' | 'Notfallsanitäter' | 'Notarzt';
  additionalQualification: 'Praxisanleiter' | 'OrgL' | 'ELRD' | 'Keine';
}

export interface Finding {
  id: string;
  label: string;
  value: string;
}

export interface IncidentData {
  patientName: string;
  patientAge: string;
  location: string;
  diagnosticValues: string;
  vitalSigns: {
    bloodPressure: string; // e.g. "120/80"
    heartRate: string;
    oxygenSaturation: string;
    temperature: string;
    respiratoryRate: string;
    glucose: string;
  };
  problems: string;
  
  // XABCDE Schema
  xabcde: {
    criticalBleeding: Finding[];
    airway: 'free' | 'obstructed' | 'unknown';
    breathing: {
      rate: string;
      sounds: string;
    };
    // C is handled by Vital Signs
    disability: Finding[];
    exposure: Finding[];
  };

  // SAMPLER Schema
  sampler: {
    symptoms: Finding[];
    allergies: Finding[];
    medication: Finding[];
    pastHistory: Finding[];
    lastMeal: string;
    events: Finding[];
    riskFactors: Finding[];
  };

  // BEFAST Schema
  befast: {
    balance: string;
    eyes: string;
    face: string;
    arms: string;
    speech: string;
    time: string;
  };

  medicationsAdministered: string;
  generalValues: string;
}

export interface HandoverProtocol {
  id: string;
  timestamp: string;
  content: string;
  isAiGenerated: boolean;
}
