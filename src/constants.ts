export const DATA = {
  kpis: {
    total_views: 12616,
    avg_reach: 1017,
    avg_er: 6.3,
    total_follows: 111,
    total_saves: 25,
    total_stories: 185,
    avg_story_views: 128,
    story_retention: 83,
    best_views: 4315,
    best_er: 10.6,
    total_reels: 9,
    avg_likes: 39.8
  },
  by_month: [
    { name: 'Jan', views: 0, er: 0, follows: 0 },
    { name: 'Feb', views: 3045, er: 3.2, follows: 26 },
    { name: 'Mar', views: 659, er: 9.5, follows: 0 },
    { name: 'Apr', views: 1519, er: 4.9, follows: 85 }
  ],
  by_hour: [
    { hour: '6:00', views: 1849, er: 3.7 },
    { hour: '10:00', views: 1626, er: 4.8 },
    { hour: '11:00', views: 681, er: 9.0 },
    { hour: '12:00', views: 462, er: 5.4 },
    { hour: '13:00', views: 617, er: 7.3 },
    { hour: '18:00', views: 2426, er: 6.6 }
  ],
  by_duration: [
    { range: '<15s', views: 1798, er: 5.1 },
    { range: '15-30s', views: 1736, er: 5.2 },
    { range: '30-60s', views: 738, er: 7.4 },
    { range: '60s+', views: 536, er: 10.6 }
  ],
  stories_weekly: [
    { week: 4, views: 84, posts: 7 },
    { week: 5, views: 187, posts: 1 },
    { week: 6, views: 136, posts: 2 },
    { week: 7, views: 130, posts: 35 },
    { week: 8, views: 127, posts: 20 },
    { week: 9, views: 134, posts: 17 },
    { week: 10, views: 128, posts: 4 },
    { week: 11, views: 200, posts: 1 },
    { week: 12, views: 136, posts: 14 },
    { week: 13, views: 155, posts: 19 },
    { week: 14, views: 135, posts: 18 },
    { week: 15, views: 106, posts: 26 },
    { week: 16, views: 105, posts: 15 },
    { week: 17, views: 169, posts: 6 }
  ],
  top_reels: [
    { desc: "Seit 3 Jahren begleite ich Räume mit Pflanzenmedizin...", views: 4315, reach: 3370, er: 2.7, follows: 64, saves: 15, date: "09/04/2026" },
    { desc: "Online-Business nach Südamérica — innere Freiheit", views: 3045, reach: 2347, er: 3.2, follows: 26, saves: 1, date: "19/02/2026" },
    { desc: "Schamanisches Medizinlied — Ecuador — Vertrauen", views: 1626, reach: 1266, er: 4.8, follows: 21, saves: 1, date: "05/04/2026" },
    { desc: "Reisen macht frei? Orte erinnern uns — Freiheit", views: 824, reach: 531, er: 10.5, follows: 0, saves: 1, date: "14/03/2026" },
    { desc: "Curandera im Dorf — traditionelle Medizin", views: 653, reach: 406, er: 4.2, follows: 0, saves: 2, date: "19/04/2026" },
    { desc: "Nicht nur claro kommen — wirklich gewinnen #innererweg", views: 617, reach: 398, er: 7.3, follows: 0, saves: 1, date: "24/03/2026" },
    { desc: "Zurückblicken — Transformation — Kakao-Zeremonie", views: 538, reach: 355, er: 7.6, follows: 0, saves: 2, date: "14/04/2026" },
    { desc: "Schleife — Muster — jahrelang festgesteckt", views: 536, reach: 303, er: 10.6, follows: 0, saves: 0, date: "28/03/2026" },
    { desc: "Das Warten cuesta más que la decisión", views: 462, reach: 184, er: 5.4, follows: 0, saves: 2, date: "16/04/2026" }
  ]
};

export const CLIENTS = [
  {
    id: 'anna',
    initials: 'AK',
    name: { es: 'Anna K.', de: 'Anna K.' },
    role: { es: 'Directora de Operaciones · Munich, 42 años', de: 'Betriebsleiterin · München, 42 Jahre' },
    details: {
      es: [
        ['Situación externa', 'Carrera sólida, equipo grande, sueldo alto. Desde afuera: lo tiene todo.'],
        ['Situación interna', 'Vacío que no sabe nombrar. Relaciones que se vaciaron. Metas que ya no dicen nada.'],
        ['Dolor central', 'El éxito no le trajo la plenitud que esperaba. No entiende por qué.'],
      ],
      de: [
        ['Äußere Situation', 'Solide Karriere, großes Team, gutes Gehalt. Von außen: Sie hat alles.'],
        ['Innere Situation', 'Eine Leere, die sie nicht benennen kann. Beziehungen, die sich entleert haben.'],
        ['Kernschmerz', 'Erfolg hat ihr nicht die Erfüllung gebracht, die sie erwartet hatte.'],
      ]
    }
  },
  {
    id: 'klaus',
    initials: 'KM',
    name: { es: 'Klaus M.', de: 'Klaus M.' },
    role: { es: 'CEO startup · Viena, 38 años', de: 'CEO Startup · Wien, 38 Jahre' },
    details: {
      es: [
        ['Situación externa', 'Emprendedor exitoso, equipo joven, empresa creciendo. Todo visible.'],
        ['Situación interna', 'No descansa. Relaciones difíciles. La soledad del que siempre "tiene que estar bien".'],
        ['Dolor central', 'Construyó todo desde el control. No sabe cómo soltar.'],
      ],
      de: [
        ['Äußere Situation', 'Erfolgreicher Unternehmer, junges Team, wachsendes Unternehmen.'],
        ['Innere Situation', 'Er ruht nicht. Schwierige Beziehungen. Die Einsamkeit dessen, der immer "okay sein muss".'],
        ['Kernschmerz', 'Hat alles aus Kontrolle aufgebaut. Weiß nicht, wie man loslässt.'],
      ]
    }
  },
  {
    id: 'sophie',
    initials: 'SC',
    name: { es: 'Sophie C.', de: 'Sophie C.' },
    role: { es: 'Diseñadora · Zürich, 34 años', de: 'Designerin · Zürich, 34 Jahre' },
    details: {
      es: [
        ['Situación externa', 'Libertad total. Trabaja desde cualquier lugar. Ingresos estables.'],
        ['Situación interna', 'Vínculos difíciles de sostener. La libertad geográfica no trajo la libertad interior.'],
        ['Dolor central', 'Tiene todo lo que "supone que necesita" para ser feliz. Pero no lo es.'],
      ],
      de: [
        ['Äußere Situation', 'Totale Freiheit. Arbeitet von überall. Stabile Einnahmen.'],
        ['Innere Situation', 'Verbindungen schwer aufrechtzuerhalten. Geografische Freiheit brachte keine innere Freiheit.'],
        ['Kernschmerz', 'Hat alles, was sie "angeblich braucht", um glücklich zu sein. Aber sie ist es nicht.'],
      ]
    }
  }
];

export const DACH_PHASES = [
  {
    id: 'p1',
    title: { es: "Optimización Bio", de: "Bio-Optimierung" },
    date: { es: "Mayo 2026 · Semanas 1-4", de: "Mai 2026 · Wochen 1-4" },
    items: {
      es: [
        "Bio 100% en alemán con keywords: 'Coach · Persönliche Entwicklung · Innere Freiheit'",
        "Campo Name: 'Nicola | Coach Persönliche Entwicklung'",
        "Highlights en alemán: Über mich / Mein Ansatz / Stimmen / Sitzung buchen",
        "Reel fijado: el de mayor ER (10.6%) — en alemán",
        "Habilitar link directo a sesión diagnóstico gratuita de 30 min"
      ],
      de: [
        "Bio 100% auf Deutsch mit Keywords: 'Coach · Persönliche Entwicklung · Innere Freiheit'",
        "Name-Feld: 'Nicola | Coach Persönliche Entwicklung'",
        "Highlights auf Deutsch: Über mich / Mein Ansatz / Stimmen / Sitzung buchen",
        "Gepinnter Reel: höchste ER (10.6%) — auf Deutsch",
        "Direkter Link zur kostenlosen 30-minütigen Diagnose-Sitzung"
      ]
    },
    metric: { es: "Meta: +50 seguidores DACH", de: "Ziel: +50 DACH-Follower" }
  },
  {
    id: 'p2',
    title: { es: "Activación y Colabs", de: "Aktivierung & Kollabs" },
    date: { es: "Junio 2026 · Semanas 5-8", de: "Juni 2026 · Wochen 5-8" },
    items: {
      es: [
        "Identificar 10 cuentas DACH de coaching/bienestar (2K-20K seguidores)",
        "Comentar diariamente 5 posts DACH con reflexiones de valor real",
        "Proponer 2-3 Reels conjunto con coaches alemanas complementarias",
        "Activar automatización Make.com para stories de texto DE cada día",
        "Serie: 3 reels 'Was du nicht weißt über...' para audiencia DACH"
      ],
      de: [
        "10 deutsche Coaching-Konten identifizieren (2K-20K Follower)",
        "Täglich 5 DACH-Beiträge mit echten Reflexionen kommentieren",
        "2-3 gemeinsame Reels mit ergänzenden deutschen Coaches vorschlagen",
        "Make.com-Automatisierung für tägliche deutsche Text-Stories aktivieren",
        "Serie: 3 Reels 'Was du nicht weißt über...' für DACH"
      ]
    },
    metric: { es: "Meta: +200 seguidores DACH", de: "Ziel: +200 DACH-Follower" }
  },
  {
    id: 'p3',
    title: { es: "SEO & Viral de Nicho", de: "SEO & Nischen-Viralität" },
    date: { es: "Julio-Agos 2026 · Semanas 9-16", de: "Juli-Aug 2026 · Wochen 9-16" },
    items: {
      es: [
        "Keywords en la primera línea: 'innere Freiheit finden', 'systemische Lücke'",
        "Carrusel educativo: '5 Anzeichen, dass du eine systemische Lücke hast'",
        "Reto: #MeinGleichgewicht — invitar a seguidores DE a compartir reflexión",
        "Publicar en horario DACH: 7-8am y 7-8pm hora de Berlín",
        "Crear FAQ específico que el mercado alemán busca en Instagram"
      ],
      de: [
        "Keywords in der ersten Zeile: 'innere Freiheit finden', 'systemische Lücke'",
        "Lern-Karussell: '5 Anzeichen für eine systemische Lücke'",
        "Challenge: #MeinGleichgewicht — Follower zur Reflexion einladen",
        "In DACH-Zeiten posten: 7-8 Uhr und 19-20 Uhr Berliner Zeit",
        "FAQ-Erstellung für spezifische Suchen des deutschen Marktes"
      ]
    },
    metric: { es: "Meta: +800 seguidores DACH", de: "Ziel: +800 DACH-Follower" }
  },
  {
    id: 'p4',
    title: { es: "Conversión & Autoridad", de: "Konvertierung & Autorität" },
    date: { es: "Sep-Dic 2026 · Semanas 17-24", de: "Sept-Dez 2026 · Wochen 17-24" },
    items: {
      es: [
        "Masterclass online en alemán: 'Warum Erfolg nicht gleich Erfüllung ist'",
        "Lanzar lista de espera por email desde Instagram",
        "Colaborar con podcasts alemanes de desarrollo personal (Guest appearance)",
        "Publicar el Libro de Nicola como Lead Magnet en alemán",
        "Testimonios en video de clientes DACH reales"
      ],
      de: [
        "Online-Mastercall auf Deutsch: 'Warum Erfolg nicht gleich Erfüllung ist'",
        "E-Mail-Warteliste über Instagram starten",
        "Gastauftritte in deutschen Persönlichkeitsentwicklungs-Podcasts",
        "Nicola Schaefersas Buch als Lead Magnet auf Deutsch anbieten",
        "Video-Testimonials von echten DACH-Klienten"
      ]
    },
    metric: { es: "Meta: 10+ clientes activos", de: "Ziel: 10+ aktive Klienten" }
  }
];

export const STORIES_DATA = [
  { p: 'equilibrio', es: 'El éxito que cansa. Hay un tipo de éxito que te agota. No porque hayas hecho algo mal, sino porque lo construiste sin escucharte.', de: 'Erfolg, der müde macht. Es gibt eine Art Erfolg, die dich erschöpft. Nicht weil du etwas falsch gemacht hast, sondern weil du ihn aufgebaut hast, ohne auf dich zu hören.', hash: '#coaching #equilibrio #innererweg' },
  { p: 'metodo', es: '¿Qué es el coaching sistémico? No es terapia. No es motivación. Es entender los sistemas que te formaron.', de: 'Was ist systemisches Coaching? Es ist keine Therapie. Keine Motivation. Es geht darum, die Systeme zu verstehen.', hash: '#coachingsistemico #holistico' },
  { p: 'cta', es: 'Si algo de lo que comparto resuena conmigo, hablemos. Sesión diagnóstico gratuita de 30 min.', de: 'Wenn dich etwas von dem, was ich teile, anspricht, lass uns reden. Kostenlose 30-Minuten-Sitzung.', hash: '#sesion1a1 #diagonal' }
];

export const AUTOMATION_PLAN = {
  id: 'make_v1',
  title: { es: "Automatización con Make.com", de: "Automatisierung mit Make.com" },
  modules: [
    {
      name: 'Content Sync',
      es: 'Sincronización automática de métricas de Meta a Dashboard externo.',
      de: 'Automatischer Metrik-Sync von Meta zum externen Dashboard.'
    },
    {
      name: 'Story Engine',
      es: 'Generación diaria de stories de texto/citas (DE+ES) basadas en el pilar activo.',
      de: 'Tägliche Generierung von Text-Stories/Zitaten (DE+ES) basierend auf der aktuellen Säule.'
    },
    {
      name: 'Lead Capture',
      es: 'Webhook para capturar DMs interesados y agendar automáticamente sesión diagnóstico.',
      de: 'Webhook für interessierte DMs und automatische Terminierung für Diagnose-Sitzungen.'
    }
  ]
};
