import React from 'react';

type Language = 'es' | 'de';

interface TranslationContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: any = {
  es: {
    appTitle: "Content Intelligence Hub",
    navAnalitica: "Analítica",
    navContenido: "Contenido",
    navEstrategia: "Estrategia",
    dashboard: "Dashboard",
    calendar: "Calendario",
    generator: "Generador IA",
    scripts: "Guiones Reels",
    stories: "Stories",
    simulator: "Simulador",
    visuals: "Content Studio",
    client: "Cliente Ideal",
    dach: "Plan DACH",
    materialization: "Materialización",
    themeDark: "Oscuro",
    themeLight: "Claro",
    viewsTotal: "Vistas totales reels",
    engagementRate: "Engagement rate",
    followersGained: "Followers ganados",
    savesTotal: "Saves totales",
    storiesPub: "Stories publicadas",
    insightLabel: "Insight clave",
    genBtn: "Generar con IA",
    genTypeLabel: "Tipo de contenido",
    genPillarLabel: "Pilar de contenido",
    genAudienceLabel: "Audiencia objetivo",
    genToneLabel: "Tono",
    genContextLabel: "Contexto adicional (opcional)",
    copy: "Copiar",
    regenerate: "Regenerar",
    addToCal: "Agregar al calendario",
  },
  de: {
    appTitle: "Content Intelligence Hub",
    navAnalitica: "Analytik",
    navContenido: "Inhalte",
    navEstrategia: "Strategie",
    dashboard: "Dashboard",
    calendar: "Kalender",
    generator: "KI-Generator",
    scripts: "Reel-Skripte",
    stories: "Stories",
    simulator: "Simulator",
    visuals: "Content Studio",
    client: "Ideale Zielgruppe",
    dach: "DACH-Plan",
    materialization: "Umsetzung",
    themeDark: "Dunkel",
    themeLight: "Hell",
    viewsTotal: "Gesamt-Aufrufe Reels",
    engagementRate: "Engagement Rate",
    followersGained: "Gewonnene Follower",
    savesTotal: "Saves gesamt",
    storiesPub: "Stories veröffentlicht",
    insightLabel: "Schlüsselerkenntnis",
    genBtn: "Mit KI generieren",
    genTypeLabel: "Inhaltstyp",
    genPillarLabel: "Content-Säule",
    genAudienceLabel: "Zielpublikum",
    genToneLabel: "Ton",
    genContextLabel: "Zusätzlicher Kontext (optional)",
    copy: "Kopieren",
    regenerate: "Regenerieren",
    addToCal: "In den Kalender",
  }
};

const TranslationContext = React.createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = React.useState<Language>('es');

  const t = (key: string) => translations[lang][key] || key;

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = React.useContext(TranslationContext);
  if (!context) throw new Error("useTranslation must be used within TranslationProvider");
  return context;
};
