/**
 * CRM Service — Basic Client & Funnel Management
 * Track clients, leads, and the sales funnel for Nicola's coaching/content business
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// ============================================================================
// TYPES
// ============================================================================

export type LeadSource = 'instagram' | 'whatsapp' | 'referral' | 'website' | 'event' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'interested' | 'qualified' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'nurturing';
export type ClientTier = 'free' | 'basic' | 'premium' | 'vip';

export interface CRMContact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  instagramHandle?: string;
  source: LeadSource;
  status: LeadStatus;
  tier: ClientTier;
  tags: string[];
  notes: string;
  lastContactAt?: number;
  nextFollowUp?: number;    // timestamp
  createdAt: number;
  updatedAt: number;
  authorId: string;
  
  // Engagement data
  engagementScore?: number;  // 0-100
  totalInteractions?: number;
  lastInteractionAt?: number;
  
  // Revenue
  dealValue?: number;
  dealCurrency?: string;
}

export interface CRMInteraction {
  id: string;
  contactId: string;
  type: 'call' | 'email' | 'whatsapp' | 'meeting' | 'dm' | 'comment';
  notes: string;
  outcome?: string;
  createdAt: number;
  authorId: string;
}

export interface CRMFunnelStats {
  new: number;
  contacted: number;
  interested: number;
  qualified: number;
  proposal_sent: number;
  negotiation: number;
  won: number;
  lost: number;
  nurturing: number;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { label: { en: string; es: string; de: string }; color: string; icon: string }> = {
  new: { label: { en: 'New', es: 'Nuevo', de: 'Neu' }, color: '#3B82F6', icon: '🔵' },
  contacted: { label: { en: 'Contacted', es: 'Contactado', de: 'Kontaktiert' }, color: '#8B5CF6', icon: '🟣' },
  interested: { label: { en: 'Interested', es: 'Interesado', de: 'Interessiert' }, color: '#F59E0B', icon: '🟡' },
  qualified: { label: { en: 'Qualified', es: 'Calificado', de: 'Qualifiziert' }, color: '#10B981', icon: '🟢' },
  proposal_sent: { label: { en: 'Proposal Sent', es: 'Propuesta Enviada', de: 'Angebot gesendet' }, color: '#6366F1', icon: '📋' },
  negotiation: { label: { en: 'Negotiation', es: 'Negociación', de: 'Verhandlung' }, color: '#EC4899', icon: '🤝' },
  won: { label: { en: 'Won', es: 'Ganado', de: 'Gewonnen' }, color: '#22C55E', icon: '✅' },
  lost: { label: { en: 'Lost', es: 'Perdido', de: 'Verloren' }, color: '#EF4444', icon: '❌' },
  nurturing: { label: { en: 'Nurturing', es: 'Nutrición', de: 'Pflege' }, color: '#F97316', icon: '🌱' },
};

// ============================================================================
// CRM SERVICE
// ============================================================================

export const crm = {

  // ── CONTACTS ────────────────────────────────────────────────────────

  async createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt' | 'authorId'>): Promise<CRMContact> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const id = `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const fullContact: CRMContact = {
      ...contact,
      id,
      authorId: userId,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'crm_contacts', id), fullContact);
    return fullContact;
  },

  async getContact(contactId: string): Promise<CRMContact | null> {
    const snapshot = await getDoc(doc(db, 'crm_contacts', contactId));
    return snapshot.exists() ? (snapshot.data() as CRMContact) : null;
  },

  async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<void> {
    await updateDoc(doc(db, 'crm_contacts', contactId), {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async deleteContact(contactId: string): Promise<void> {
    await deleteDoc(doc(db, 'crm_contacts', contactId));
  },

  async listContacts(filters?: {
    status?: LeadStatus;
    source?: LeadSource;
    tier?: ClientTier;
    search?: string;
  }): Promise<CRMContact[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let q = query(collection(db, 'crm_contacts'), where('authorId', '==', userId), orderBy('updatedAt', 'desc'));

    if (filters?.status) q = query(q, where('status', '==', filters.status));
    if (filters?.tier) q = query(q, where('tier', '==', filters.tier));

    const snapshot = await getDocs(q);
    let contacts = snapshot.docs.map(d => d.data() as CRMContact);

    // Client-side search
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      contacts = contacts.filter(c =>
        c.firstName.toLowerCase().includes(s) ||
        c.lastName.toLowerCase().includes(s) ||
        c.email?.toLowerCase().includes(s) ||
        c.instagramHandle?.toLowerCase().includes(s)
      );
    }

    return contacts;
  },

  // ── INTERACTIONS ────────────────────────────────────────────────────

  async addInteraction(interaction: Omit<CRMInteraction, 'id' | 'createdAt' | 'authorId'>): Promise<CRMInteraction> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const id = `interaction_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const full: CRMInteraction = {
      ...interaction,
      id,
      authorId: userId,
      createdAt: Date.now(),
    };

    await setDoc(doc(db, 'crm_interactions', id), full);

    // Update contact's lastInteractionAt
    await this.updateContact(interaction.contactId, {
      lastInteractionAt: Date.now(),
      lastContactAt: Date.now(),
      totalInteractions: (await this.getContact(interaction.contactId))?.totalInteractions ?? 0 + 1,
    });

    return full;
  },

  async getInteractions(contactId: string): Promise<CRMInteraction[]> {
    const q = query(
      collection(db, 'crm_interactions'),
      where('contactId', '==', contactId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as CRMInteraction);
  },

  // ── FUNNEL STATS ────────────────────────────────────────────────────

  async getFunnelStats(): Promise<CRMFunnelStats> {
    const contacts = await this.listContacts();
    const stats: CRMFunnelStats = {
      new: 0, contacted: 0, interested: 0, qualified: 0,
      proposal_sent: 0, negotiation: 0, won: 0, lost: 0, nurturing: 0,
    };

    for (const contact of contacts) {
      stats[contact.status]++;
    }

    return stats;
  },

  // ── REAL-TIME ────────────────────────────────────────────────────────

  subscribe(
    callback: (contacts: CRMContact[]) => void,
    filters?: { status?: LeadStatus }
  ): () => void {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return () => {};

    let q = query(collection(db, 'crm_contacts'), where('authorId', '==', userId), orderBy('updatedAt', 'desc'));
    if (filters?.status) q = query(q, where('status', '==', filters.status));

    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(d => d.data() as CRMContact));
    });
  },

  // ── HELPERS ──────────────────────────────────────────────────────────

  getDisplayName(contact: CRMContact): string {
    return `${contact.firstName} ${contact.lastName}`.trim() || contact.instagramHandle || contact.email || 'Unknown';
  },

  getPipelineValue(contacts: CRMContact[]): number {
    return contacts
      .filter(c => ['proposal_sent', 'negotiation', 'won'].includes(c.status))
      .reduce((sum, c) => sum + (c.dealValue || 0), 0);
  },

  getConversionRate(contacts: CRMContact[]): number {
    const total = contacts.filter(c => c.status !== 'nurturing').length;
    const won = contacts.filter(c => c.status === 'won').length;
    return total > 0 ? (won / total) * 100 : 0;
  },
};