import type { SystemId } from './types'

/**
 * Contexto de las fuentes oficiales del reto, por sistema del cuerpo.
 *
 * Cada entrada resume (con palabras propias, no copiadas) una página que el
 * equipo LEYÓ el 14-nov-2026 en nasa.gov o asc-csa.gc.ca. Son fuentes cualitativas:
 * justifican qué se monitorea y qué contramedidas reporta NASA, pero NO fijan los
 * umbrales numéricos de VitalSeal (esos están en thresholds.ts con su estado de
 * verificación). Es un prototipo de investigación, no un dispositivo médico.
 */
export interface SourceEntry {
  /** Quién publica la fuente. */
  agency: 'NASA' | 'CSA'
  title: string
  url: string
  /** Resumen propio del riesgo o dato. */
  summary: string
  /** Qué reporta la fuente que se está haciendo al respecto (resumido). */
  actions: string[]
  /** Nota de VitalSeal sobre cómo se relaciona con la app (interpretación nuestra). */
  note?: string
}

const NASA = 'https://www.nasa.gov/reference/'

export const SYSTEM_SOURCES: Record<SystemId, SourceEntry[]> = {
  cardio: [
    {
      agency: 'NASA',
      title: 'Risk of Cardiovascular Adaptations',
      url: `${NASA}risk-of-cardiovascular-adaptations/`,
      summary:
        'Low gravity and other stressors change how the heart and blood vessels work. Possible effects include blood clots, irregular heartbeat and low blood pressure, which raises the chance of fainting at landing.',
      actions: [
        'Regular exercise and a healthy diet help crews keep cardiovascular fitness.',
        'Leg compression garments and plenty of fluids before landing help prevent low blood pressure.',
        'Future Mars crews will get extra training to respond to cardiovascular emergencies.',
      ],
      note: 'Heart rate and blood pressure are the VitalSeal indicators linked to this risk.',
    },
    {
      agency: 'NASA',
      title: 'Risk of Hypoxia',
      url: `${NASA}risk-of-hypoxia/`,
      summary:
        'Planned partial cabin depressurization on deep-space missions lowers nitrogen in the body but raises the chance of mild hypoxia (low oxygen in tissues). It can bring confusion, headaches, vision problems and poor sleep. NASA currently rates this risk as relatively low.',
      actions: [
        'NASA is designing protocols that balance oxygen level and pressure before and during spacewalks.',
        'Researchers use archived spacewalk health data and pressure-chamber studies to learn tolerable oxygen levels.',
      ],
      note: 'SpO2 is the VitalSeal indicator linked to this risk.',
    },
  ],
  neuro: [
    {
      agency: 'NASA',
      title: 'Risk from Inadequate Sleep and Irregular Schedules',
      url: `${NASA}risk-from-inadequate-sleep-and-irregular-schedules/`,
      summary:
        'Heavy workload, irregular light-dark cycles and disrupted sleep strain the body and can affect mission success. On the space station the crew sees 16 sunrises and sunsets every day.',
      actions: [
        'Station lighting imitates the Earth light-dark cycle to help crews sleep.',
        'Researchers study how light and caffeine shift the body clock.',
        'Crews get scheduled time for relaxation and self-care to help avoid burnout.',
      ],
      note: 'Daily sleep hours is the VitalSeal indicator linked to this risk.',
    },
    {
      agency: 'NASA',
      title: 'Risk of Behavioral Changes and Psychiatric Disorders',
      url: `${NASA}risk-of-behavioral-changes-and-psychiatric-disorders/`,
      summary:
        'Long isolation and confinement can raise the risk of behavioral problems such as anxiety and depression, and can affect sleep, morale and decision-making. Long communication delays on a Mars trip add to the challenge.',
      actions: [
        'Self-care such as keeping a regular journal is encouraged.',
        'Windows and privacy are studied as ways to ease monotony and the sense of confinement.',
        'NASA studies volunteers living isolated on Earth to test coping strategies.',
      ],
      note: 'The daily mood score is the VitalSeal indicator linked to this risk.',
    },
  ],
  musculoskeletal: [
    {
      agency: 'NASA',
      title: 'Risk of Spaceflight-Induced Bone Changes',
      url: `${NASA}risk-of-spaceflight-induced-bone-changes/`,
      summary:
        'In microgravity, bones lose roughly 1% to 1.5% of their density each month on 4 to 6 month missions, which raises the risk of fractures.',
      actions: [
        'Resistance exercise is an essential protection for bone and muscle.',
        'Bone scans before and after flight track how density changes.',
      ],
      note: 'Pain and muscle symptoms reported in the daily check feed this zone.',
    },
    {
      agency: 'NASA',
      title: 'Risk of Reduced Cardiorespiratory and Musculoskeletal Fitness',
      url: `${NASA}risk-of-reduced-cardiorespiratory-and-musculoskeletal-fitness/`,
      summary:
        'Microgravity weakens bones, muscles and the cardiopulmonary system, making mission tasks harder and injuries more likely, especially during gravity transitions. Station data show average strength and aerobic fitness losses of 10% to 12% of pre-mission levels.',
      actions: [
        'Station crews do resistance and aerobic training six to seven days a week, about 1.5 hours a day.',
        'Periodic fitness self-evaluations help researchers monitor health and adjust training.',
      ],
    },
  ],
  radiation: [
    {
      agency: 'NASA',
      title: 'Risk of Radiation-Induced Cancers',
      url: `${NASA}risk-of-radiation-induced-cancers/`,
      summary:
        'Astronauts receive more radiation in space than on Earth, which can lead to certain cancers and may raise the risk of degenerative conditions of the heart, blood vessels and eyes, and possibly the central nervous system.',
      actions: [
        'NASA is developing health surveillance practices and countermeasures against radiation effects.',
        'Instruments aboard the space station measure radiation exposure.',
      ],
      note: 'Cumulative radiation dose is the VitalSeal indicator linked to this risk.',
    },
    {
      agency: 'CSA',
      title: 'Monitoring radiation for astronaut health (Canadian Space Agency)',
      url: 'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
      summary:
        'The CSA is funding CANS, a compact, autonomous instrument that measures neutron radiation continuously. Neutrons account for about 30% of total radiation on the space station.',
      actions: ['Continuous, autonomous measurement is the goal, so exposure is tracked without manual steps.'],
      note: 'This is why VitalSeal handles radiation dose as a sensor value rather than a typed-in number.',
    },
    {
      agency: 'NASA',
      title: 'Risk of Altered Immune System Responses',
      url: `${NASA}risk-of-altered-immune-system-responses/`,
      summary:
        'Radiation, microgravity, poor sleep and other stressors can alter immune responses, including reawakening dormant viruses and triggering allergic reactions.',
      actions: [
        'Blood, saliva and urine samples are monitored to learn what triggers these changes.',
        'A recent focus is analyzing samples collected during flight and returned to Earth.',
      ],
      note: 'Reported symptoms such as skin rash feed this zone.',
    },
  ],
  metabolic: [
    {
      agency: 'NASA',
      title: 'Risk of Inadequate Food and Nutrition',
      url: `${NASA}risk-of-inadequate-food-and-nutrition/`,
      summary:
        'Adequate nutrition keeps body and mind healthy, but designing varied, safe, long-lasting meals for long missions without regular resupply is complex.',
      actions: [
        'Researchers are working on a more nutritious, longer-lasting food system and testing it in long-duration analogs.',
      ],
      note: 'Body temperature is tracked because the challenge lists it as an example indicator. The NASA pages read do not set temperature limits, and VitalSeal does not track food intake yet.',
    },
  ],
}

/** Programas y marco general de NASA que respaldan el enfoque de chequeo diario. */
export interface ProgramContext {
  title: string
  url: string
  summary: string
  /** Paralelo con VitalSeal (interpretación nuestra; NASA no avala el proyecto). */
  vitalSealParallel: string
}

export const PROGRAM_CONTEXT: ProgramContext[] = [
  {
    title: 'ARCHeR (Artemis Research for Crew Health & Readiness)',
    url: 'https://www.nasa.gov/reference/archer/',
    summary:
      'A study that measures astronauts’ well-being, activity, sleep patterns and interactions across the Artemis missions, using activity monitors and behavioral surveys.',
    vitalSealParallel: 'VitalSeal also combines objective sleep and activity signals with a short self-reported check.',
  },
  {
    title: 'Artemis II Spaceflight Standard Measures',
    url: 'https://www.nasa.gov/reference/artemis-ii-standard-measures/',
    summary:
      'A standardized set of measurements across several physiological systems, collected before, during and after the mission, extending a data bank started in 2018 with more than 30 space station astronauts.',
    vitalSealParallel:
      'VitalSeal measures the same fixed set of indicators the same way every day and compares each reading with the person’s own baseline.',
  },
  {
    title: '5 Hazards of Human Spaceflight (distance from Earth)',
    url: 'https://www.nasa.gov/hrp/hazards/',
    summary:
      'Instructions, supplies and medical care become harder to receive from Earth as crews travel deeper into space, so planning and self-sufficiency matter. A Mars trip would take roughly three years.',
    vitalSealParallel: 'The distance selector changes the escalation protocol, from immediate consult to autonomous.',
  },
]

/** Todas las URLs citadas, para pruebas y para el campo References del formulario. */
export function allSourceUrls(): string[] {
  const urls = new Set<string>()
  for (const entries of Object.values(SYSTEM_SOURCES)) for (const e of entries) urls.add(e.url)
  for (const p of PROGRAM_CONTEXT) urls.add(p.url)
  return [...urls].sort()
}
