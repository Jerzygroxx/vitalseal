import { Bone, Brain, Flame, HeartPulse, Radiation, type LucideIcon } from 'lucide-react'
import type { SystemId } from '../../domain/types'

/** Icono por sistema corporal (solo presentación). */
export const SYSTEM_ICONS: Record<SystemId, LucideIcon> = {
  neuro: Brain,
  cardio: HeartPulse,
  metabolic: Flame,
  musculoskeletal: Bone,
  radiation: Radiation,
}
