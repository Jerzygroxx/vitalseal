import type { SystemId } from './types'

/**
 * Plain-language wording for the guided flows. Each body system has a calm wording
 * ("Something feels off") and an urgent wording ("Emergency"); both open the
 * quick-response checklist of that system (see playbooks.ts).
 */
export type FlowMode = 'off' | 'emergency'

export interface SituationText {
  title: string
  hint: string
}

export const SITUATIONS: Record<FlowMode, Record<SystemId, SituationText>> = {
  off: {
    neuro: { title: 'Head, sleep or mood', hint: 'Tired, low mood, poor sleep or trouble focusing' },
    cardio: { title: 'Heart, pressure or breathing', hint: 'Racing heart, dizziness or short of breath' },
    metabolic: { title: 'Temperature or feeling unwell', hint: 'Fever, chills, nausea or no appetite' },
    musculoskeletal: { title: 'Muscles, bones or pain', hint: 'Back pain, sore joints or an injury' },
    radiation: { title: 'Radiation or other symptoms', hint: 'Dosimeter reading, alert or unusual symptoms' },
  },
  emergency: {
    neuro: { title: 'Confusion, severe headache or a blow to the head', hint: 'Act now' },
    cardio: { title: 'Chest pain, racing heart or trouble breathing', hint: 'Act now' },
    metabolic: { title: 'High fever or feeling very ill', hint: 'Act now' },
    musculoskeletal: { title: 'Injury or severe pain', hint: 'Act now' },
    radiation: { title: 'Radiation alert', hint: 'Act now' },
  },
}

export const SYSTEM_ORDER: SystemId[] = ['cardio', 'neuro', 'metabolic', 'musculoskeletal', 'radiation']
