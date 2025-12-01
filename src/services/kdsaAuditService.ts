
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import { AuditLogEntry } from '../types/kdsa.types';

const db = admin.firestore();
const COLLECTION = 'kdsa_audit_ledger';

export const kdsaAuditService = {
  /**
   * Generates a SHA-256 hash from the log payload + previous hash
   */
  generateHash(data: Omit<AuditLogEntry, 'id' | 'hash'>, prevHash: string): string {
    const payload = JSON.stringify(data) + prevHash;
    return crypto.createHash('sha256').update(payload).digest('hex');
  },

  /**
   * Retrieves the most recent log entry to maintain the chain
   */
  async getLastEntry(): Promise<AuditLogEntry | null> {
    const snapshot = await db.collection(COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as AuditLogEntry;
  },

  /**
   * Appends a new event to the immutable ledger
   */
  async logEvent(entry: Omit<AuditLogEntry, 'id' | 'hash' | 'previousHash' | 'timestamp'>): Promise<string> {
    const lastEntry = await this.getLastEntry();
    const previousHash = lastEntry ? lastEntry.hash : 'GENESIS_HASH_0000000000000000';
    const timestamp = new Date().toISOString();

    const payload = {
      ...entry,
      timestamp,
      previousHash
    };

    const hash = this.generateHash(payload, previousHash);

    const finalEntry: AuditLogEntry = {
      ...payload,
      hash
    };

    const docRef = await db.collection(COLLECTION).add(finalEntry);
    return docRef.id;
  },

  /**
   * Validates the cryptographic integrity of the entire chain
   */
  async verifyChain(): Promise<{ valid: boolean; brokenAtId?: string }> {
    const snapshot = await db.collection(COLLECTION).orderBy('timestamp', 'asc').get();
    let prevHash = 'GENESIS_HASH_0000000000000000';

    for (const doc of snapshot.docs) {
      const data = doc.data() as AuditLogEntry;
      
      // Re-calculate hash
      const { id, hash, ...content } = data; // content contains previousHash
      const calculatedHash = this.generateHash(content, data.previousHash);

      // Check 1: Does the stored hash match the data?
      if (calculatedHash !== hash) {
        return { valid: false, brokenAtId: doc.id };
      }

      // Check 2: Is the chain continuous?
      if (data.previousHash !== prevHash) {
        return { valid: false, brokenAtId: doc.id };
      }

      prevHash = hash;
    }

    return { valid: true };
  },

  /**
   * Fetches all logs for DORA export
   */
  async getAllLogs(): Promise<AuditLogEntry[]> {
    const snapshot = await db.collection(COLLECTION).orderBy('timestamp', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLogEntry));
  }
};
