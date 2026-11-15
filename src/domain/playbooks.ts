import { SYSTEM_SOURCES } from './evidence'
import type { Distance, Status, SystemId } from './types'

/**
 * Quick-response playbooks: what to DO now when a body system is not green.
 *
 * Prototype guidance written at a general first-aid level (stop, rest, re-measure,
 * check the environment, call for help, record). No drug names and no doses.
 * It has NOT been validated by a flight surgeon: onboard medical procedures and
 * ground instructions always take priority. Each playbook links the NASA HRP
 * pages that explain the risk behind it.
 */
export interface Playbook {
  system: SystemId
  status: Exclude<Status, 'green'>
  title: string
  /** Ordered steps, 3 to 6, imperative and short. */
  doNow: string[]
  /** What to do after the steps, to decide whether it improved. */
  recheck: string
  /** One line per distance: what the crew does about contact with ground. */
  escalate: Record<Distance, string>
  /** Facts worth logging, so the event record is complete. */
  record: string[]
  /** HRP / CSA pages behind this risk. */
  sources: string[]
  note: string
}

export const PLAYBOOK_NOTE =
  'Prototype guidance based on general first-aid principles. Not validated by a flight surgeon. Onboard medical procedures and ground instructions take priority.'

const ESCALATE: Record<Distance, string> = {
  leo: 'Call ground now: the real-time link is available.',
  moon: 'Message ground now and keep working the checklist; a reply takes seconds to minutes.',
  mars: 'Work this checklist now and send the signed report; a ground reply can take up to 22 minutes.',
}

const URGENT_FIRST = 'Stop what you are doing and ask a crewmate to stay with you.'

interface Draft {
  title: string
  amber: string[]
  red: string[]
  recheck: string
  record: string[]
}

const DRAFTS: Record<SystemId, Draft> = {
  cardio: {
    title: 'Heart, blood pressure or oxygen out of range',
    amber: [
      'Sit down and rest for 2 minutes.',
      'Check that the sensor sits well on your skin, then measure again.',
      'If oxygen is low, check cabin oxygen and CO2 readings and ventilation, and move to air that reads normal.',
      'Note any chest pain, breathlessness, dizziness or fainting.',
    ],
    red: [
      URGENT_FIRST,
      'Sit or lie down and keep still.',
      'Check the sensor, then measure again after 1 minute.',
      'Check cabin oxygen and CO2 readings and ventilation, and move to air that reads normal.',
      'If you have chest pain, severe breathlessness or fainting, use the onboard emergency medical procedure now.',
    ],
    recheck: 'Measure again in 10 minutes. If values are still out of range or you feel worse, act on it as urgent.',
    record: ['Heart rate, blood pressure and SpO2 before and after resting', 'Cabin oxygen and CO2 readings', 'Symptoms and when they started', 'Activity just before'],
  },
  neuro: {
    title: 'Sleep or mood out of range',
    amber: [
      'Protect a sleep window tonight: postpone every task that can wait.',
      'Check light, noise and temperature in your sleep area.',
      'Ask a crewmate to double-check critical work today.',
      'Talk with a crewmate or with ground about how you feel.',
    ],
    red: [
      URGENT_FIRST,
      'Pause critical tasks (maneuvers, robotics, spacewalk preparation) until you are rested.',
      'Rest in a quiet, dark place and drink water.',
      'Tell ground how you feel: use the private psychological support channel if you have one.',
      'If you feel confused, have a severe headache or notice a sudden change in behavior, use the onboard emergency medical procedure now.',
    ],
    recheck: 'Log sleep and mood again tomorrow. If you slept under 4 hours twice in a row, tell ground.',
    record: ['Hours slept and sleep quality', 'Mood score and what changed', 'Workload and schedule shifts', 'Any confusion or headache'],
  },
  metabolic: {
    title: 'Body temperature out of range',
    amber: [
      'Rest and drink water.',
      'Measure again in 15 minutes with the same method.',
      'Check cabin temperature and adjust your layers.',
      'Note other symptoms: chills, cough, sore throat, nausea.',
    ],
    red: [
      URGENT_FIRST,
      'Rest, drink water and keep a comfortable temperature.',
      'Measure again in 10 minutes with the same method.',
      'Limit close contact with crewmates and follow the onboard hygiene steps.',
      'Tell ground now and log every symptom.',
    ],
    recheck: 'Measure again in 1 hour. If the temperature stays out of range, tell ground.',
    record: ['Temperature and measuring method', 'Cabin temperature', 'Other symptoms and when they started', 'Fluids taken'],
  },
  musculoskeletal: {
    title: 'Pain or muscle and bone symptoms',
    amber: [
      'Stop the movement that causes the pain and rest that area.',
      'Note where it hurts, how strong it is (0 to 10) and what you were doing.',
      'Use gentle, pain-free movement only; do not train the sore area today.',
      'Tell ground at the next contact and ask for an adjusted exercise plan.',
    ],
    red: [
      URGENT_FIRST,
      'Stop all movement of the painful area and keep it still.',
      'Note where it hurts, how strong it is (0 to 10), what you were doing and whether there was a blow or fall.',
      'Do not exercise until ground has reviewed it.',
      'Tell ground now.',
    ],
    recheck: 'Rate the pain again in 1 hour and tomorrow. If it grows or you cannot use the area, tell ground.',
    record: ['Location and pain from 0 to 10', 'What you were doing', 'Whether there was a blow or fall', 'Exercise done in the last 24 hours'],
  },
  radiation: {
    title: 'Radiation exposure or symptoms',
    amber: [
      'Read your personal dosimeter and note the value and the time.',
      'If a radiation alert is active, move to the best-shielded area and stay there until the all-clear.',
      'Note symptoms such as nausea, fatigue or skin redness.',
      'Tell ground at the next contact and review the activity plan.',
    ],
    red: [
      URGENT_FIRST,
      'Move to the best-shielded area of the vehicle now and stay there until the all-clear.',
      'Read your personal dosimeter and note the value and the time.',
      'Note symptoms such as nausea, vomiting or skin redness.',
      'Tell ground now.',
    ],
    recheck: 'Read the dosimeter again after the alert ends and log the new value.',
    record: ['Dosimeter value and time', 'Whether an alert was active', 'Where you were in the vehicle', 'Symptoms and when they started'],
  },
}

/**
 * Playbook for a system that is not green. Returns null when nothing needs doing.
 * Steps come from the table above; escalation text depends on the mission distance.
 */
export function playbookFor(system: SystemId, status: Status, _distance?: Distance): Playbook | null {
  if (status === 'green') return null
  const d = DRAFTS[system]
  return {
    system,
    status,
    title: d.title,
    doNow: status === 'red' ? d.red : d.amber,
    recheck: d.recheck,
    escalate: { ...ESCALATE },
    record: d.record,
    sources: SYSTEM_SOURCES[system].map((s) => s.url),
    note: PLAYBOOK_NOTE,
  }
}

export const ALL_PLAYBOOK_SYSTEMS: SystemId[] = ['cardio', 'neuro', 'metabolic', 'musculoskeletal', 'radiation']
