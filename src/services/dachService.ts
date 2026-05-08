/**
 * DACH Market Intelligence — Data and insights for the German-speaking market
 * Provides market data, cultural context, and localization intelligence
 * for content targeting DACH region (Deutschland, Austria, Switzerland)
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { geminiService } from './geminiService';

// ============================================================================
// TYPES
// ============================================================================

export type DACHCountry = 'DE' | 'AT' | 'CH';
export type DACHTopic = 'trends' | 'holidays' | 'culture' | 'language' | 'regulations' | 'competitors';

export interface DACHInsight {
  id: string;
  country: DACHCountry;
  topic: DACHTopic;
  title: string;
  summary: string;
  relevance: 'high' | 'medium' | 'low';
  source?: string;
  validUntil?: number;
  createdAt: number;
}

export interface DACHHoliday {
  date: string;       // YYYY-MM-DD
  name: string;
  nameDe: string;
  country: DACHCountry | 'ALL';
  type: 'public' | 'observance' | 'cultural';
  contentOpportunity: string;
}

export interface DACHTrend {
  id: string;
  name: string;
  description: string;
  country: DACHCountry;
  category: string;
  growth: number;      // percentage growth
  volume: number;       // search volume or mentions
  contentAngle: string;
  hashtags: string[];
}

export interface DACHLanguageTip {
  id: string;
  german: string;
  spanish: string;
  english: string;
  context: string;
  doUse: string[];
  dontUse: string[];
}

// ============================================================================
// DACH HOLIDAYS 2026
// ============================================================================

const DACH_HOLIDAYS_2026: DACHHoliday[] = [
  // Germany
  { date: '2026-01-01', name: 'New Year', nameDe: 'Neujahr', country: 'ALL', type: 'public', contentOpportunity: 'Year reflection, goals, new beginnings' },
  { date: '2026-01-06', name: 'Epiphany', nameDe: 'Heilige Drei Könige', country: 'AT', type: 'public', contentOpportunity: 'Cultural content for Austria/Bavaria' },
  { date: '2026-02-17', name: 'Carnival', nameDe: 'Karneval/Fasching', country: 'DE', type: 'cultural', contentOpportunity: 'Fun, lighthearted content, community' },
  { date: '2026-03-08', name: 'International Women\'s Day', nameDe: 'Frauentag', country: 'ALL', type: 'cultural', contentOpportunity: 'Empowerment, female voices, community' },
  { date: '2026-04-03', name: 'Good Friday', nameDe: 'Karfreitag', country: 'ALL', type: 'public', contentOpportunity: 'Reflection, silence, valley experience' },
  { date: '2026-04-06', name: 'Easter Monday', nameDe: 'Ostermontag', country: 'ALL', type: 'public', contentOpportunity: 'Rebirth, transformation, new beginnings' },
  { date: '2026-05-01', name: 'Labour Day', nameDe: 'Tag der Arbeit', country: 'ALL', type: 'public', contentOpportunity: 'Work-life balance, systematic method' },
  { date: '2026-05-14', name: 'Ascension Day', nameDe: 'Christi Himmelfahrt/Vatertag', country: 'DE', type: 'public', contentOpportunity: 'Father figures, masculine emotional intelligence' },
  { date: '2026-05-25', name: 'Whit Monday', nameDe: 'Pfingstmontag', country: 'ALL', type: 'public', contentOpportunity: 'Spirit, community, connection' },
  { date: '2026-06-04', name: 'Corpus Christi', nameDe: 'Fronleichnam', country: 'AT', type: 'public', contentOpportunity: 'Cultural content Austria/Bavaria' },
  { date: '2026-08-15', name: 'Assumption Day', nameDe: 'Mariä Himmelfahrt', country: 'AT', type: 'public', contentOpportunity: 'Cultural, spiritual content' },
  { date: '2026-10-03', name: 'German Unity Day', nameDe: 'Tag der Deutschen Einheit', country: 'DE', type: 'public', contentOpportunity: 'Unity, community, national identity' },
  { date: '2026-10-26', name: 'National Day', nameDe: 'Nationalfeiertag', country: 'AT', type: 'public', contentOpportunity: 'Austrian identity, cultural pride' },
  { date: '2026-11-01', name: 'All Saints\' Day', nameDe: 'Allerheiligen', country: 'ALL', type: 'public', contentOpportunity: 'Remembrance, grief, emotional processing' },
  { date: '2026-12-06', name: 'St. Nicholas Day', nameDe: 'Nikolaustag', country: 'ALL', type: 'cultural', contentOpportunity: 'Gift giving, community, traditions' },
  { date: '2026-12-24', name: 'Christmas Eve', nameDe: 'Heiligabend', country: 'ALL', type: 'cultural', contentOpportunity: 'Family, togetherness, emotional intensity' },
  { date: '2026-12-25', name: 'Christmas Day', nameDe: 'Weihnachten', country: 'ALL', type: 'public', contentOpportunity: 'Gratitude, family, reflection' },
  { date: '2026-12-31', name: 'New Year\'s Eve', nameDe: 'Silvester', country: 'ALL', type: 'cultural', contentOpportunity: 'Year review, resolutions, transformation' },
  // Swiss-specific
  { date: '2026-08-01', name: 'Swiss National Day', nameDe: 'Schweizer Nationalfeiertag', country: 'CH', type: 'public', contentOpportunity: 'Swiss identity, multilingual community' },
  { date: '2026-09-22', name: 'Federal Fast', nameDe: 'Eidgenössischer Dank-, Buss- und Bettag', country: 'CH', type: 'public', contentOpportunity: 'Reflection, gratitude, community' },
];

// ============================================================================
// LANGUAGE TIPS
// ============================================================================

const LANGUAGE_TIPS: DACHLanguageTip[] = [
  {
    id: 'du_vs_sie',
    german: 'Du vs. Sie',
    spanish: 'Tú vs. Usted',
    english: 'Informal vs. Formal "You"',
    context: 'Instagram is informal — always use "Du" unless targeting a corporate audience',
    doUse: ['Du (informal)', 'Dein (your)', 'Dir (to you)', 'Dich (you, acc)'],
    dontUse: ['Sie (formal)', 'Ihr (formal your)', 'Ihnen (to you, formal)'],
  },
  {
    id: 'gemutlichkeit',
    german: 'Gemütlichkeit',
    spanish: 'Bienestar acogedor',
    english: 'Cozy well-being',
    context: 'Core German cultural value — warmth, comfort, belonging. Untranslatable but essential.',
    doUse: ['Gemütlichkeit', 'Gemütlich', 'Es ist gemütlich'],
    dontUse: ['Translating to "cozy" (insufficient)', 'Using in formal/business context'],
  },
  {
    id: 'feierabend',
    german: 'Feierabend',
    spanish: 'Fin de jornada',
    english: 'End of workday',
    context: 'Germans guard their Feierabend fiercely. Respect the work-life boundary.',
    doUse: ['Feierabend', 'Nach Feierabend', 'Jetzt ist Feierabend'],
    dontUse: ['Implied work after hours', 'Hustle culture messaging'],
  },
  {
    id: 'innerlichkeit',
    german: 'Innerlichkeit',
    spanish: 'Interioridad',
    english: 'Inner life / inwardness',
    context: 'German cultural trait of deep inner reflection. Perfect for emotional mastery content.',
    doUse: ['Innerlichkeit', 'Nachdenken', 'Innere Welt'],
    dontUse: ['Surface-level positivity', 'Dismissing emotional depth'],
  },
  {
    id: 'sehnsucht',
    german: 'Sehnsucht',
    spanish: 'Anhelo / Añoranza',
    english: 'Longing / yearning',
    context: 'Deep German emotional concept. Use for valley experience and transformation content.',
    doUse: ['Sehnsucht', 'Ich sehne mich nach...'],
    dontUse: ['Simple translation as "missing" (insufficient)'],
  },
];

// ============================================================================
// DACH SERVICE
// ============================================================================

export const dachService = {

  /**
   * Get upcoming holidays (next 30 days)
   */
  getUpcomingHolidays(country?: DACHCountry, daysAhead: number = 30): DACHHoliday[] {
    const now = new Date();
    const future = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    
    return DACH_HOLIDAYS_2026
      .filter(h => {
        const date = new Date(h.date);
        return date >= now && date <= future;
      })
      .filter(h => !country || h.country === country || h.country === 'ALL')
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  /**
   * Get content opportunities for the next 14 days
   */
  getContentOpportunities(country?: DACHCountry): Array<{ holiday: DACHHoliday; daysUntil: number }> {
    const now = new Date();
    const holidays = this.getUpcomingHolidays(country, 14);
    
    return holidays.map(h => ({
      holiday: h,
      daysUntil: Math.ceil((new Date(h.date).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    }));
  },

  /**
   * Get language tips
   */
  getLanguageTips(): DACHLanguageTip[] {
    return LANGUAGE_TIPS;
  },

  /**
   * Generate AI-powered DACH insights
   */
  async generateInsights(topic: string, country: DACHCountry = 'DE'): Promise<string> {
    const countryName = { DE: 'Germany', AT: 'Austria', CH: 'Switzerland' }[country];
    
    return geminiService.generateContent(
      `Provide market insights for the ${countryName} DACH market on: "${topic}"`,
      `You are a DACH market intelligence analyst for an Instagram content creator. 
       Provide actionable insights about "${topic}" in the ${countryName} market.
       Include: cultural context, content angles, trending hashtags, and timing recommendations.
       Focus on what makes this market unique and how to connect authentically.
       Keep it concise and actionable. Respond in German with Spanish/English translations for key terms.`
    );
  },

  /**
   * Get best posting times for DACH region
   */
  getBestPostingTimes(): Record<DACHCountry, { weekday: string[]; weekend: string[] }> {
    return {
      DE: {
        weekday: ['07:00-09:00', '12:00-13:00', '17:00-19:00', '20:00-22:00'],
        weekend: ['10:00-12:00', '14:00-16:00', '19:00-21:00'],
      },
      AT: {
        weekday: ['07:30-09:00', '12:00-13:00', '17:30-19:30', '20:00-21:30'],
        weekend: ['09:30-11:30', '14:00-16:00', '19:00-21:00'],
      },
      CH: {
        weekday: ['07:00-08:30', '12:00-13:00', '18:00-20:00'],
        weekend: ['10:00-12:00', '15:00-17:00'],
      },
    };
  },

  /**
   * Save a DACH insight to Firestore
   */
  async saveInsight(insight: Omit<DACHInsight, 'id' | 'createdAt'>): Promise<string> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const id = `dach_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'dach_insights', id), {
      ...insight,
      id,
      authorId: userId,
      createdAt: Date.now(),
    });

    return id;
  },

  /**
   * Get saved DACH insights
   */
  async getInsights(country?: DACHCountry, topic?: DACHTopic): Promise<DACHInsight[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let q = query(collection(db, 'dach_insights'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    if (country) q = query(q, where('country', '==', country));
    if (topic) q = query(q, where('topic', '==', topic));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as DACHInsight);
  },
};