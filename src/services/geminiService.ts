import { GoogleGenAI } from "@google/genai";
import { IncidentData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateHandoverProtocol(data: IncidentData): Promise<string> {
  const prompt = `
    Du bist ein erfahrener Notfallsanitäter. Erstelle ein professionelles, fließendes Übergabeprotokoll basierend auf folgenden Einsatzdaten:
    
    PATIENT: ${data.patientName}, Alter: ${data.patientAge}
    ORT: ${data.location}
    
    VITALWERTE:
    - Blutdruck: ${data.vitalSigns.bloodPressure}
    - Puls: ${data.vitalSigns.heartRate} bpm
    - SpO2: ${data.vitalSigns.oxygenSaturation} %
    - Temperatur: ${data.vitalSigns.temperature} °C
    - Atemfrequenz: ${data.vitalSigns.respiratoryRate}/min
    - Blutzucker: ${data.vitalSigns.glucose} mg/dl
    
    XABCDE-SCHEMA:
    - X (Kritische Blutungen): ${data.xabcde.criticalBleeding.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - A (Atemwege): ${data.xabcde.airway}
    - B (Belüftung): AF ${data.xabcde.breathing.rate}, Geräusche: ${data.xabcde.breathing.sounds}
    - D (Defizite): ${data.xabcde.disability.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - E (Exposition): ${data.xabcde.exposure.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    
    SAMPLER:
    - Symptome: ${data.sampler.symptoms.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - Allergien: ${data.sampler.allergies.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - Medikamente: ${data.sampler.medication.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - Patientengeschichte: ${data.sampler.pastHistory.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - Letzte Mahlzeit: ${data.sampler.lastMeal}
    - Ereignis: ${data.sampler.events.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    - Risikofaktoren: ${data.sampler.riskFactors.map(f => `${f.label}: ${f.value}`).join(', ') || 'Keine'}
    
    BEFAST:
    - Balance: ${data.befast.balance}, Eyes: ${data.befast.eyes}, Face: ${data.befast.face}, Arms: ${data.befast.arms}, Speech: ${data.befast.speech}, Time: ${data.befast.time}
    
    THERAPIE & SONSTIGES:
    - Verabreichte Medikamente: ${data.medicationsAdministered}
    - Allgemeine Bemerkungen: ${data.generalValues}
    - Hauptprobleme: ${data.problems}
    
    Das Protokoll soll sachlich, präzise und in medizinischer Fachsprache verfasst sein. Es soll direkt mit der Schilderung der Situation beginnen.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Fehler bei der Generierung.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Fehler bei der Generierung des Protokolls.";
  }
}

export async function suggestMeasures(data: IncidentData): Promise<string> {
  const prompt = `
    Du bist ein medizinischer Experte für Notfallmedizin. Analysiere die folgenden Einsatzdaten und schlage konkrete medizinische Maßnahmen vor.
    Berücksichtige dabei die Leitlinien und die Dringlichkeit.
    
    DATEN:
    ${JSON.stringify(data, null, 2)}
    
    Gib die Empfehlungen in einer klaren, priorisierten Liste aus. Erkläre kurz das "Warum" für jede Maßnahme.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Fehler bei der Analyse.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Fehler bei der Maßnahmen-Empfehlung.";
  }
}

export async function getAiAssistance(query: string, context: IncidentData): Promise<string> {
  const prompt = `
    Du bist ein KI-Assistent für den Rettungsdienst auf einem Tablet.
    Aktueller Patient: ${context.patientName}
    Probleme: ${context.problems}
    Vitalwerte: BP ${context.vitalSigns.bloodPressure}, HR ${context.vitalSigns.heartRate}, SpO2 ${context.vitalSigns.oxygenSaturation}
    
    Frage des Sanitäters: ${query}
    
    Antworte kurz, präzise und medizinisch fundiert.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Fehler bei der KI-Anfrage.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Fehler bei der KI-Anfrage.";
  }
}
