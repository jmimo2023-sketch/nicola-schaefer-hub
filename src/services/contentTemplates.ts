/**
 * Content Template Service — Pre-built templates for each content pillar
 * 
 * 25 templates organized by the 5 pillars:
 * Emotional Mastery (5) | Systematic Method (5) | Valley Experience (5) | Transformation (5) | Community (5)
 * 
 * Each template includes: hook patterns, structure, CTA, hashtags, and tone guidance
 */

import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { promptMaestro, type ContentPillar, type ContentType } from './brandVoiceAgent';

// ============================================================================
// TYPES
// ============================================================================

export interface ContentTemplate {
  id: string;
  name: string;
  pillar: ContentPillar;
  type: ContentType;
  language: 'es' | 'de' | 'en';
  description: string;
  hookPattern: string;
  structure: string[];
  ctaPattern: string;
  hashtagGroups: string[][];
  toneGuidance: string;
  example: string;
  isCustom?: boolean;
  authorId?: string;
  createdAt?: number;
}

// ============================================================================
// TEMPLATE LIBRARY — 25 Templates (5 per pillar)
// ============================================================================

const TEMPLATE_LIBRARY: ContentTemplate[] = [
  // ── EMOTIONAL MASTERY ──────────────────────────────────────────
  {
    id: 'em_vuln_post',
    name: 'Vulnerabilidad como Poder',
    pillar: 'emotional_mastery',
    type: 'caption',
    language: 'es',
    description: 'Post que transforma una vulnerabilidad personal en una lección de fuerza',
    hookPattern: '¿Alguna vez sentiste que [EMOCIÓN] era tu debilidad... cuando en realidad era tu superpoder?',
    structure: ['Hook emocional', 'Historia personal (3 líneas)', 'Giro: la vulnerabilidad = fortaleza', 'Pregunta reflexiva', 'CTA'],
    ctaPattern: '¿Cuál es la emoción que más temes mostrar? Escríbela abajo 👇',
    hashtagGroups: [
      ['#Vulnerabilidad', '#Emociones', '#FuerzaInterior'],
      ['#Autoconocimiento', '#DesarrolloPersonal', '#Emocional'],
      ['#EmotionalMastery', '#VulnerabilityIsStrength'],
    ],
    toneGuidance: 'Vulnerable yet empowering. Start soft, end strong.',
    example: '¿Alguna vez sentiste que llorar era debilidad?\n\nYo también. Hasta que entendí que las lágrimas no son rendición — son liberación.\n\nLa última vez que lloré frente a alguien, no me sentí débil. Me sentí libre.\n\nPorque esconder lo que sientes no te hace fuerte. Te hace prisionero.\n\n¿Cuál es la emoción que más temes mostrar? 👇',
  },
  {
    id: 'em_feel_wheel',
    name: 'La Rueda de Emociones',
    pillar: 'emotional_mastery',
    type: 'carousel',
    language: 'es',
    description: 'Carrusel que mapea las emociones del día a día',
    hookPattern: 'Hoy siento [EMOCIÓN]. ¿Y tú?',
    structure: ['Slide 1: Hook pregunta', 'Slides 2-5: Una emoción cada uno con descriptor', 'Slide 6: "Ninguna emoción es mala"', 'Slide 7: CTA'],
    ctaPattern: '¿Qué emoción sientes HOY? Comenta con un emoji 👇',
    hashtagGroups: [['#RuedaDeEmociones', '#Emocional'], ['#InteligenciaEmocional'], ['#FeelYourFeelings']],
    toneGuidance: 'Warm, inclusive, validating every emotion.',
    example: 'Slide 1: "Hoy siento..."\nSlide 2: "Tristeza — esa que no sale con distractores"\nSlide 3: "Alegría — la que no necesita razón"\nSlide 4: "Enojo — el que te dice qué necesitas cambiar"\nSlide 5: "Esperanza — la que se enciende en la oscuridad"\nSlide 6: "Ninguna emoción es equivocada"\nSlide 7: "¿Qué emoción sientes AHORA? 👇"',
  },
  {
    id: 'em_letter_self',
    name: 'Carta a Mí Mismo/a',
    pillar: 'emotional_mastery',
    type: 'caption',
    language: 'es',
    description: 'Formato de carta íntima dirigida a uno mismo',
    hookPattern: 'Querido/a [TU NOMBRE]...',
    structure: ['Saludo íntimo', '3 cosas que necesitas escuchar', 'Promesa personal', 'CTA de reflexión'],
    ctaPattern: 'Escribe tu propia carta. Etiquétame para que la lea 💛',
    hashtagGroups: [['#CartaAMí'], ['#SelfLove'], ['#AmorPropio', '#CartaPersonal']],
    toneGuidance: 'Intimate, like writing in a journal.',
    example: 'Querida yo del futuro:\n\nPrimero: estás haciendo lo mejor que puedes.\nSegundo: no tienes que ser fuerte todo el tiempo.\nTercero: mereces el mismo amor que das.\n\nCon cariño,\nYo del presente\n\n¿Te atreves a escribirte una carta? 💛',
  },
  {
    id: 'em_reel_feeling',
    name: 'Reel: Lo Que Siento vs. Lo Que Muestro',
    pillar: 'emotional_mastery',
    type: 'reel_script',
    language: 'es',
    description: 'Reel que contrasta la fachada con la realidad emocional',
    hookPattern: 'Lo que muestro vs. lo que realmente siento',
    structure: ['3 segundos: Fachada sonriente', 'Transición', '3 segundos: Realidad emocional', 'Texto revelador', 'CTA'],
    ctaPattern: 'Doble tap si alguna vez fingiste estar bien 💔➡️💛',
    hashtagGroups: [['#RealVsReel'], ['#MentalHealth'], ['#LoQueSiento']],
    toneGuidance: 'Start performative, end raw and honest.',
    example: '[Sonrisa forzada] "Estoy bien"\n[Transición]\n[Rostro real] "En realidad, hoy me cuesta"\n\nNo tienes que fingir. No aquí. No conmigo.\n\nDoble tap si alguna vez fingiste estar bien 💔➡️💛',
  },
  {
    id: 'em_question_series',
    name: 'Preguntas Que Nadie Hace',
    pillar: 'emotional_mastery',
    type: 'story_sequence',
    language: 'es',
    description: 'Secuencia de stories con preguntas profundas',
    hookPattern: 'Pregunta que nadie se atreve a hacer...',
    structure: ['Story 1: Pregunta profunda', 'Story 2: Encuesta', 'Story 3: Mi respuesta', 'Story 4: Reflexión final'],
    ctaPattern: 'Responde en el DM si prefieres privacidad 🤫',
    hashtagGroups: [['#PreguntasProfundas'], ['#Reflexión']],
    toneGuidance: 'Provocative, intimate, creating safe space.',
    example: 'Story 1: "¿Cuándo fue la última vez que dijiste la verdad sobre cómo te sientes?"\nStory 2: [Encuesta: Hoy / Esta semana / Hace más de un mes]\nStory 3: "La mía fue... ayer."\nStory 4: "No estás solo/a en esto. 💛"',
  },

  // ── SYSTEMATIC METHOD ──────────────────────────────────────────
  {
    id: 'sm_3_steps',
    name: '3 Pasos Para...',
    pillar: 'systematic_method',
    type: 'caption',
    language: 'es',
    description: 'Formato de pasos numerados simple y accionable',
    hookPattern: '3 pasos para [RESULTADO]. El #2 es el que nadie espera.',
    structure: ['Hook con número de pasos', 'Paso 1: Lo obvio', 'Paso 2: El inesperado', 'Paso 3: El que lo cambia todo', 'CTA'],
    ctaPattern: 'Guarda este post para cuando lo necesites 📌',
    hashtagGroups: [['#3Pasos', '#Método'], ['#DesarrolloPersonal'], ['#SystematicGrowth']],
    toneGuidance: 'Direct, structured, actionable. No fluff.',
    example: '3 pasos para dejar de procrastinar.\n\n1. No esperes motivación — empieza con 2 minutos.\n2. Usa la regla del "solo una cosa" — ¿qué es lo ÚNICO que necesitas hacer hoy?\n3. Celebra antes de terminar — tu cerebro necesita el refuerzo.\n\nEl #2 lo cambió todo para mí.\n\nGuarda este post 📌',
  },
  {
    id: 'sm_framework_carousel',
    name: 'Framework Visual',
    pillar: 'systematic_method',
    type: 'carousel',
    language: 'es',
    description: 'Carrusel que explica un framework visual paso a paso',
    hookPattern: 'El framework que me tomó [TIEMPO] descubrir (y 2 minutos entender)',
    structure: ['Slide 1: Título del framework', 'Slides 2-4: Cada paso con visual', 'Slide 5: Ejemplo real', 'Slide 6: Resumen', 'Slide 7: CTA'],
    ctaPattern: '¿Qué framework te gustaría que explique? Comenta 👇',
    hashtagGroups: [['#Framework'], ['#Método'], ['#SystematicMethod']],
    toneGuidance: 'Clear, visual, educational. Teacher mode.',
    example: 'Slide 1: "El Framework VALLE"\nSlide 2: "V — Visualiza dónde estás"\nSlide 3: "A — Acepta lo que no puedes cambiar"\nSlide 4: "L — Lidera tu siguiente paso"\nSlide 5: "L — Logra una victoria pequeña"\nSlide 6: "E — Evoluciona repetidamente"\nSlide 7: "¿Qué framework quieres? 👇"',
  },
  {
    id: 'sm_checklist_reel',
    name: 'Reel: Checklist Visual',
    pillar: 'systematic_method',
    type: 'reel_script',
    language: 'es',
    description: 'Reel con checklist visual de acciones',
    hookPattern: 'Checklist de [RESULTADO] que necesitas HOY',
    structure: ['Presentación del checklist', 'Check animado por cada ítem', 'Resultado final', 'CTA'],
    ctaPattern: '¿Cuántos ya tienes? Comenta el número 👇',
    hashtagGroups: [['#Checklist'], ['#Productividad'], ['#Método']],
    toneGuidance: 'Fast-paced, energetic, satisfying checkmarks.',
    example: '[Título] Checklist de crecimiento interior:\n✅ 10 min de reflexión\n✅ 1 cosa que agradecer\n✅ 1 límite que poner\n✅ 1 meta pequeña para mañana\n✅ Descanso sin culpa\n\n¿Cuántos tienes hoy? 👇',
  },
  {
    id: 'sm_comparison',
    name: 'Antes vs. Después (Método)',
    pillar: 'systematic_method',
    type: 'caption',
    language: 'es',
    description: 'Contraste de cómo se hacía antes vs. el nuevo método',
    hookPattern: 'Cómo lo hacía ANTES vs. cómo lo hago AHORA',
    structure: ['Antes: el problema', 'Después: el método', '3 cambios clave', 'Resultado', 'CTA'],
    ctaPattern: '¿Qué cambiarías de tu método? 👇',
    hashtagGroups: [['#AntesYDespués'], ['#Método'], ['#Hábitos']],
    toneGuidance: 'Relatable start, authoritative resolution.',
    example: 'ANTES: Planificaba todo y no hacía nada.\nAHORA: Planifico lo mínimo y hago lo máximo.\n\n3 cambios:\n1. De "perfecto" a "hecho"\n2. De 10 metas a 1 prioridad\n3. De "mañana" a "2 minutos ahora"\n\n¿Qué cambiarías? 👇',
  },
  {
    id: 'sm_story_challenge',
    name: 'Reto de 7 Días (Stories)',
    pillar: 'systematic_method',
    type: 'story_sequence',
    language: 'es',
    description: 'Secuencia de stories para un reto de 7 días',
    hookPattern: 'Reto de 7 días: [OBJETIVO]. ¿Te animas?',
    structure: ['Story 1: Presentación del reto', 'Story 2: Regla #1', 'Story 3: Encuesta compromiso', 'Story 4: Día 1 asignación'],
    ctaPattern: 'Responde "ME ANIMO" para unirte 🔥',
    hashtagGroups: [['#Reto7Días'], ['#Challenge'], ['#Crecimiento']],
    toneGuidance: 'Energetic, motivational, community-building.',
    example: 'Story 1: "RETO DE 7 DÍAS: Reconectar con tus emociones 🔥"\nStory 2: "Regla #1: No puedes saltar un día"\nStory 3: [Encuesta: ¿Te animas? SÍ/NOMÁS TARDE]\nStory 4: "Día 1: Escribe 3 emociones que sentiste hoy"',
  },

  // ── VALLEY EXPERIENCE ───────────────────────────────────────────
  {
    id: 've_dark_night',
    name: 'La Noche Oscura',
    pillar: 'valley_experience',
    type: 'caption',
    language: 'es',
    description: 'Reflexión sobre un momento oscuro y lo que enseñó',
    hookPattern: 'Hay un momento que no le cuento a nadie...',
    structure: ['El momento oscuro', 'Lo que sentí', 'Lo que aprendí', 'Lo que cambiaría', 'CTA de comunidad'],
    ctaPattern: 'No estás solo/a. Escribe "presente" si necesitas escuchar eso hoy 💛',
    hashtagGroups: [['#NocheOscura'], ['#Valle'], ['#Resiliencia']],
    toneGuidance: 'Raw, honest, vulnerable. No silver lining forced.',
    example: 'Hay un momento que no le cuento a nadie.\n\nFue un martes. Llovía. Y yo no podía levantarme.\n\nNo fue depresión clínica. Fue algo peor: la sensación de que todo esfuerzo era en vano.\n\nLo que aprendí: ese vacío no era el final. Era el espacio donde algo nuevo iba a nacer.\n\nNo estás solo/a. "Presente" si necesitas escuchar eso hoy 💛',
  },
  {
    id: 've_lesson_from_pain',
    name: 'Lo Que Aprendí del Dolor',
    pillar: 'valley_experience',
    type: 'caption',
    language: 'es',
    description: 'Lección extraída de una experiencia dolorosa',
    hookPattern: 'El dolor me enseñó algo que los libros no podían:',
    structure: ['La experiencia dolorosa', 'La lección inesperada', 'Cómo la aplico hoy', 'CTA'],
    ctaPattern: '¿Qué te enseñó tu momento más difícil? 👇',
    hashtagGroups: [['#LecciónDelDolor'], ['#Valle'], ['#Aprendizaje']],
    toneGuidance: 'Reflective, wisdom-sharing, never preachy.',
    example: 'El dolor me enseñó algo que los libros no podían:\n\nQue pedir ayuda no es debilidad.\n\nMi momento más bajo fue también el momento en que más personas se acercaron. Y yo no quería dejarlas entrar.\n\nHoy sé: la vulnerabilidad no es la ausencia de fuerza. Es la presencia de verdad.\n\n¿Qué te enseñó tu momento más difícil? 👇',
  },
  {
    id: 've_survival_guide',
    name: 'Guía de Supervivencia Emocional',
    pillar: 'valley_experience',
    type: 'carousel',
    language: 'es',
    description: 'Carrusel con guía práctica para momentos difíciles',
    hookPattern: 'Guía de supervivencia para cuando la vida se pone difícil',
    structure: ['Slide 1: Título', 'Slides 2-5: Una herramienta por slide', 'Slide 6: Recursos', 'Slide 7: "Estás aquí, eso es suficiente"', 'CTA'],
    ctaPattern: 'Guarda esto para cuando lo necesites 📌 O envíalo a alguien que lo necesite 💛',
    hashtagGroups: [['#GuíaDeSupervivencia'], ['#SaludMental'], ['#Resiliencia']],
    toneGuidance: 'Compassionate, practical, never dismissive of pain.',
    example: 'Slide 1: "Guía de Supervivencia Emocional 🆘"\nSlide 2: "1. Respira. 4-7-8. Inhala 4, sostén 7, exhala 8."\nSlide 3: "2. Escribe. No pienses, solo escribe lo que sientes."\nSlide 4: "3. Muévete. 5 minutos de caminata. Sin teléfono."\nSlide 5: "4. Conecta. Un mensaje a una persona de confianza."\nSlide 6: "Línea de ayuda: [número local]"\nSlide 7: "Estás aquí. Eso es suficiente. 💛"',
  },
  {
    id: 've_reel_valley',
    name: 'Reel: En el Valle',
    pillar: 'valley_experience',
    type: 'reel_script',
    language: 'es',
    description: 'Reel que valida la experiencia del valle sin forzar positividad',
    hookPattern: 'No te voy a decir "todo pasa por algo"',
    structure: ['Rechazo de positividad tóxica', 'Validación del dolor', 'Presencia en vez de soluciones', 'CTA de comunidad'],
    ctaPattern: 'Mándale esto a alguien que está en el valle 🤝',
    hashtagGroups: [['#EnElValle'], ['#SinToxicidadPositiva']],
    toneGuidance: 'Raw, validating, no forced positivity.',
    example: 'No te voy a decir "todo pasa por algo."\n\nLo que sí te digo: estás en tu derecho de sentirte como te sientes.\n\nY si hoy no puedes ver la luz — está bien. No tienes que verla.\n\nSolo necesitas saber que alguien más está aquí. 🤝',
  },
  {
    id: 've_resilience_map',
    name: 'Mapa de Resiliencia',
    pillar: 'valley_experience',
    type: 'story_sequence',
    language: 'es',
    description: 'Stories interactivas mapeando la resiliencia personal',
    hookPattern: '¿Dónde estás en tu mapa de resiliencia?',
    structure: ['Story 1: Mapa visual', 'Story 2: Encuesta: ¿Qué fase estás?', 'Story 3: Mensaje personalizado', 'Story 4: Recurso específico'],
    ctaPattern: 'Responde con tu fase del mapa 🗺️',
    hashtagGroups: [['#MapaDeResiliencia'], ['#Valle']],
    toneGuidance: 'Interactive, map metaphor, phase-specific.',
    example: 'Story 1: "Mapa de Resiliencia: 🗺️"\nStory 2: [Encuesta: ¿En qué fase estás? Sobreviviendo / Reconstruyendo / Floreciendo]\nStory 3: "Si estás sobreviviendo: está bien no estar bien."\nStory 4: "Recurso: 5 minutos de respiración guiada [link]"',
  },

  // ── TRANSFORMATION ──────────────────────────────────────────────
  {
    id: 'tr_before_after',
    name: 'Antes y Después (Personal)',
    pillar: 'transformation',
    type: 'caption',
    language: 'es',
    description: 'Contraste honesto de transformación personal',
    hookPattern: 'Hace [TIEMPO] yo era... Ahora soy...',
    structure: ['El "antes" honesto', 'El punto de quiebre', 'El "después" realista', 'Lo que cambió internamente', 'CTA'],
    ctaPattern: '¿Qué has transformado en tu vida? Comparte tu antes y después 👇',
    hashtagGroups: [['#AntesYDespués'], ['#Transformación'], ['#Evolución']],
    toneGuidance: 'Honest, not performative. Real transformation, not highlight reel.',
    example: 'Hace 2 años yo era la persona que decía sí a todo.\n\nNo porque quisiera — sino porque tenía miedo de decir no.\n\nHoy digo no. Y el mundo no se cayó.\n\nLo que cambió internamente: mi valor no depende de lo que los demás necesitan de mí.\n\n¿Qué has transformado? 👇',
  },
  {
    id: 'tr_micro_transformations',
    name: 'Micro-Transformaciones',
    pillar: 'transformation',
    type: 'carousel',
    language: 'es',
    description: 'Carrusel de pequeños cambios que crearon grandes resultados',
    hookPattern: 'No fue un gran cambio. Fueron 5 micro-cambios.',
    structure: ['Slide 1: Hook', 'Slides 2-6: Micro-cambio cada uno', 'Slide 7: "La transformación es diaria"', 'CTA'],
    ctaPattern: '¿Cuál de estos ya haces? Comenta el número 👇',
    hashtagGroups: [['#MicroCambios'], ['#TransformaciónDiaria']],
    toneGuidance: 'Approachable, showing transformation is incremental.',
    example: 'Slide 1: "No fue un gran cambio. Fueron 5 micro-cambios."\nSlide 2: "1. Despertar sin teléfono (10 min)"\nSlide 3: "2. Escribir 3 gratitudes antes de dormir"\nSlide 4: "3. Caminar 15 min sin música"\nSlide 5: "4. Decir no a algo cada semana"\nSlide 6: "5. 5 min de silencio antes de reaccionar"\nSlide 7: "La transformación es diaria. 🌱"',
  },
  {
    id: 'tr_becoming',
    name: 'En Proceso de Ser',
    pillar: 'transformation',
    type: 'caption',
    language: 'es',
    description: 'Reflexión sobre la transformación como proceso continuo',
    hookPattern: 'No estoy donde quiero estar. Pero tampoco estoy donde estaba.',
    structure: ['Reconocimiento del presente', 'Aceptación del proceso', 'Compromiso con seguir', 'CTA'],
    ctaPattern: 'Escribe "en proceso" si estás en camino 🌱',
    hashtagGroups: [['#EnProceso'], ['#Evolución']],
    toneGuidance: 'Humble, process-oriented, no arrival narrative.',
    example: 'No estoy donde quiero estar.\n\nPero tampoco estoy donde estaba.\n\nY eso — eso ya es una transformación.\n\nNo necesito llegar. Necesito seguir.\n\n"En proceso" si estás en camino 🌱',
  },
  {
    id: 'tr_reel_evolution',
    name: 'Reel: Evolución Visual',
    pillar: 'transformation',
    type: 'reel_script',
    language: 'es',
    description: 'Reel mostrando evolución física/emocional',
    hookPattern: 'No es el "antes y después" que esperas...',
    structure: ['Expectativa vs. realidad', 'Transformación interna', 'Mensaje de proceso', 'CTA'],
    ctaPattern: '¿Tu transformación más grande ha sido interna o externa? 👇',
    hashtagGroups: [['#EvoluciónReal'], ['#Transformación']],
    toneGuidance: 'Visual storytelling, emphasizing internal over external change.',
    example: '[Expectativa: transformación física dramática]\n[Realidad: la transformación más grande fue interna]\n\nLa transformación que importa no se ve en el espejo.\nSe siente en cómo reaccionas, cómo descansas, cómo dices no.\n\n¿Tu transformación más grande? 👇',
  },
  {
    id: 'tr_1year_later',
    name: 'Un Año Después',
    pillar: 'transformation',
    type: 'story_sequence',
    language: 'es',
    description: 'Secuencia de stories reflexionando sobre cambios en un año',
    hookPattern: '¿Qué cambiarías si pudieras hablar con tu yo de hace 1 año?',
    structure: ['Story 1: Pregunta reflexiva', 'Story 2: Encuesta', 'Story 3: Mi respuesta', 'Story 4: Invitación'],
    ctaPattern: 'Escribe una carta a tu yo de hace 1 año y etiquétame 📝',
    hashtagGroups: [['#1AñoDespués'], ['#ReflexiónAnual']],
    toneGuidance: 'Reflective, milestone-oriented, gentle.',
    example: 'Story 1: "¿Qué le dirías a tu yo de hace 1 año?"\nStory 2: [Encuesta: Todo está bien / Estoy en proceso / Me arrepiento de algo]\nStory 3: "Yo le diría: \'Sigue adelante. Lo que no mata de verdad, transforma.\'"\nStory 4: "Escribe una carta a tu yo del pasado. Es terapéutico. 📝"',
  },

  // ── COMMUNITY ────────────────────────────────────────────────────
  {
    id: 'co_gathering',
    name: 'Convocatoria de Comunidad',
    pillar: 'community',
    type: 'caption',
    language: 'es',
    description: 'Post que convoca y genera sentido de pertenencia',
    hookPattern: 'Este espacio es para [QUIÉN].',
    structure: ['Definición de la comunidad', 'Lo que compartimos', 'Lo que NO es este espacio', 'Invitación', 'CTA'],
    ctaPattern: 'Comenta con un 🙋 si este es tu lugar.',
    hashtagGroups: [['#Comunidad'], ['#EsteEspacioEsParaTi']],
    toneGuidance: 'Inclusive, warm, boundary-setting.',
    example: 'Este espacio es para quienes sienten demasiado y dicen muy poco.\n\nAquí compartimos: vulnerabilidad, crecimiento, preguntas sin respuestas.\n\nLo que NO es este espacio: juicio, positividad tóxica, competición.\n\nSi estás buscando un lugar donde no tienes que fingir — este es.\n\n🙋 si este es tu lugar.',
  },
  {
    id: 'co_challenge_together',
    name: 'Reto Grupal',
    pillar: 'community',
    type: 'carousel',
    language: 'es',
    description: 'Carrusel lanzando un reto para hacer en comunidad',
    hookPattern: 'Reto grupal: [ACCIÓN] durante [TIEMPO]. ¿Quién se anima?',
    structure: ['Slide 1: Reto', 'Slides 2-4: Reglas y pasos', 'Slide 5: Cómo compartir', 'Slide 6: Grupo de apoyo', 'Slide 7: CTA'],
    ctaPattern: 'Comenta "ME SUMO" si te unes al reto 🔥',
    hashtagGroups: [['#RetoGrupal'], ['#JuntosEsMejor']],
    toneGuidance: 'Energetic, collaborative, community-building.',
    example: 'Slide 1: "RETO GRUPAL: 7 días sin quejarse 🔥"\nSlide 2: "Regla 1: Si te quejas, escribes 3 gratitudes"\nSlide 3: "Regla 2: Comparte tu progreso en stories"\nSlide 4: "Regla 3: Apoya a otro participante cada día"\nSlide 5: "Comparte con #7DíasSinQuejas"\nSlide 6: "Grupo de apoyo en el link de bio"\nSlide 7: "¿Te sumas? 🔥"',
  },
  {
    id: 'co_sharing_circle',
    name: 'Círculo de Compartir',
    pillar: 'community',
    type: 'caption',
    language: 'es',
    description: 'Post que invita a compartir experiencias en los comentarios',
    hookPattern: 'Hoy comparto algo personal. Y te invito a hacer lo mismo.',
    structure: ['Mi experiencia', 'La invitación', 'El espacio seguro', 'CTA'],
    ctaPattern: 'Los comentarios de hoy son un espacio seguro. Comparte lo que necesites 💛',
    hashtagGroups: [['#CírculoDeCompartir'], ['#ComunidadSegura']],
    toneGuidance: 'Safe, intimate, holding space for others.',
    example: 'Hoy comparto algo personal.\n\nEsta semana lloré en el supermercado. Sin razón aparente. Y no me importa quién me vio.\n\nAhora te toca. Los comentarios de hoy son un espacio seguro. Sin juicios, sin consejos no pedidos.\n\nComparte lo que necesites 💛',
  },
  {
    id: 'co_reel_us',
    name: 'Reel: Nosotros',
    pillar: 'community',
    type: 'reel_script',
    language: 'es',
    description: 'Reel celebrando a la comunidad y sus miembros',
    hookPattern: 'Lo más bonito de esta comunidad no soy yo. Son USTEDES.',
    structure: ['Reconocimiento', 'Capturas de comentarios', 'Mensaje de agradecimiento', 'CTA'],
    ctaPattern: 'Etiqueta a alguien de esta comunidad que te inspira 🙌',
    hashtagGroups: [['#Nosotros'], ['#Comunidad']],
    toneGuidance: 'Gratitude, celebration, community pride.',
    example: 'Lo más bonito de esta comunidad no soy yo.\n\nSon los comentarios que me hacen llorar.\nLos DMs que me dicen "no estaba solo/a".\nLas veces que se apoyan entre ustedes.\n\nEsto es NUESTRO espacio. 🙌\n\nEtiqueta a alguien que te inspira aquí 👇',
  },
  {
    id: 'co_poll_connection',
    name: 'Encuesta de Conexión',
    pillar: 'community',
    type: 'story_sequence',
    language: 'es',
    description: 'Secuencia de stories con encuestas para conectar',
    hookPattern: '¿Nos conectamos? Responde esta encuesta...',
    structure: ['Story 1: Pregunta personal', 'Story 2: Encuesta', 'Story 3: Resultado + reflexión', 'Story 4: Invitación a seguir conectando'],
    ctaPattern: 'Responde el DM para seguir la conversación 🤝',
    hashtagGroups: [['#ConexiónReal'], ['#Comunidad']],
    toneGuidance: 'Casual, warm, creating genuine connection.',
    example: 'Story 1: "Quiero conocerte mejor. Respondemos juntos?"\nStory 2: [Encuesta: ¿Qué buscas en esta comunidad? Aprender / Conectar / Ambos]\nStory 3: "El 73% dijo AMBOS. Eso me da vida."\nStory 4: "Mándame un DM con lo que más necesitas. Te leo. 🤝"',
  },
];

// ============================================================================
// TEMPLATE SERVICE
// ============================================================================

export const templateService = {

  /**
   * Get all built-in templates
   */
  getBuiltInTemplates(pillar?: ContentPillar, type?: ContentType): ContentTemplate[] {
    let filtered = TEMPLATE_LIBRARY;
    if (pillar) filtered = filtered.filter(t => t.pillar === pillar);
    if (type) filtered = filtered.filter(t => t.type === type);
    return filtered;
  },

  /**
   * Get a specific template by ID
   */
  getTemplate(id: string): ContentTemplate | undefined {
    return TEMPLATE_LIBRARY.find(t => t.id === id);
  },

  /**
   * Generate content from a template using Brand Voice Agent
   */
  async generateFromTemplate(
    templateId: string,
    customizations?: {
      topic?: string;
      tone?: string;
      language?: 'es' | 'de' | 'en';
    }
  ): Promise<string> {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error(`Template ${templateId} not found`);

    return promptMaestro.generate(
      template.type,
      template.pillar,
      customizations?.topic || template.hookPattern,
      {
        defaultTone: (customizations?.tone as any) || 'vulnerable',
        language: customizations?.language || template.language,
        includeCTA: true,
        includeHook: true,
      }
    ).then(result => result.content);
  },

  /**
   * Save a custom template
   */
  async saveCustomTemplate(template: Omit<ContentTemplate, 'createdAt'>): Promise<string> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('Not authenticated');

    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await setDoc(doc(db, 'content_templates', id), {
      ...template,
      id,
      isCustom: true,
      authorId: userId,
      createdAt: Date.now(),
    });

    return id;
  },

  /**
   * Get custom templates for the current user
   */
  async getCustomTemplates(pillar?: ContentPillar): Promise<ContentTemplate[]> {
    const auth = getAuth();
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let q = query(collection(db, 'content_templates'), where('authorId', '==', userId), orderBy('createdAt', 'desc'));
    if (pillar) q = query(q, where('pillar', '==', pillar));

    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as ContentTemplate);
  },

  /**
   * Get all templates (built-in + custom)
   */
  async getAllTemplates(pillar?: ContentPillar, type?: ContentType): Promise<ContentTemplate[]> {
    const builtIn = this.getBuiltInTemplates(pillar, type);
    const custom = await this.getCustomTemplates(pillar);
    return [...builtIn, ...custom.filter(c => !type || c.type === type)];
  },

  /**
   * Get templates organized by pillar
   */
  getByPillar(): Record<ContentPillar, ContentTemplate[]> {
    return {
      emotional_mastery: this.getBuiltInTemplates('emotional_mastery'),
      systematic_method: this.getBuiltInTemplates('systematic_method'),
      valley_experience: this.getBuiltInTemplates('valley_experience'),
      transformation: this.getBuiltInTemplates('transformation'),
      community: this.getBuiltInTemplates('community'),
    };
  },
};