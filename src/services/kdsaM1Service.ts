
import * as admin from 'firebase-admin';
import { ACOREAssessment, ACOREResult } from '../types/kdsa.types';

const db = admin.firestore();
const COLLECTION = 'kdsa_acore_assessments';

export const kdsaM1Service = {
  /**
   * Calculates the ORS based on ADKAR, SCARF, and Karasek inputs.
   * Rules: High Change Fatigue (>50) or Low Psych Safety (<60) trigger High Risk.
   */
  calculateResilienceScore(data: ACOREAssessment): ACOREResult {
    // 1. Calculate Sub-metrics
    // Simple averages for MVP logic
    const adkarScore = Object.values(data.adkar).reduce((a, b) => a + b, 0) / 5;
    const scarfScore = Object.values(data.scarf).reduce((a, b) => a + b, 0) / 5;
    
    // Karasek: Job Strain = Demands / Control (simplified)
    // We normalize this to a 0-100 scale where 100 is good (Low Strain)
    const demandRatio = data.karasek.jobDemands / (data.karasek.jobControl || 1); 
    const karasekScore = Math.max(0, 100 - (demandRatio * 20)); 

    // 2. Identify Risk Flags
    // Heuristic: "Change Fatigue" roughly maps to low Ability/Reinforcement and high Demands
    const changeFatigueMetric = (data.adkar.ability + data.adkar.reinforcement) / 2; // Low is bad
    const psychSafetyMetric = (data.scarf.relatedness + data.scarf.fairness) / 2; // Low is bad

    const highChangeFatigue = changeFatigueMetric < 50; // If Ability/Reinforcement is low, fatigue is high
    const lowPsychSafety = psychSafetyMetric < 60;
    const highJobStrain = karasekScore < 40;

    // 3. Compute Composite ORS
    const orsScore = Math.round((adkarScore + scarfScore + karasekScore) / 3);

    // 4. Determine Overall Risk Level
    let riskLevel: ACOREResult['riskLevel'] = 'LOW';
    if (highChangeFatigue || lowPsychSafety) riskLevel = 'HIGH';
    if (highChangeFatigue && lowPsychSafety && highJobStrain) riskLevel = 'CRITICAL';
    else if (orsScore < 50) riskLevel = 'MEDIUM';

    return {
      assessmentId: '', // Populated after save
      orsScore,
      riskFlags: {
        highChangeFatigue,
        lowPsychSafety,
        highJobStrain
      },
      riskLevel
    };
  },

  /**
   * Persists the assessment and returns the result
   */
  async processAssessment(data: ACOREAssessment): Promise<ACOREResult> {
    const result = this.calculateResilienceScore(data);
    
    const docRef = await db.collection(COLLECTION).add({
      input: data,
      output: result,
      processedAt: new Date().toISOString()
    });

    result.assessmentId = docRef.id;
    return result;
  }
};
