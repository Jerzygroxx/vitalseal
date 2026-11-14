import { describe, expect, it } from 'vitest'
import { distanceLabel, escalationLabel, formatLatency, statusLabel } from './format'

describe('statusLabel', () => {
  it('usa el mismo texto que StatusBadge', () => {
    expect(statusLabel('green')).toBe('OK')
    expect(statusLabel('amber')).toBe('Watch')
    expect(statusLabel('red')).toBe('Alert')
  })
})

describe('formatLatency', () => {
  it('cubre los bordes pedidos: 0.5, 1, 2.5, 59.9, 60 y 1320', () => {
    expect(formatLatency(0.5)).toBe('<1 s')
    expect(formatLatency(1)).toBe('1.0 s')
    expect(formatLatency(2.5)).toBe('2.5 s')
    expect(formatLatency(59.9)).toBe('59.9 s')
    expect(formatLatency(60)).toBe('1 min')
    expect(formatLatency(1320)).toBe('22 min')
  })

  it('trata 0 (y negativos) como menos de un segundo', () => {
    expect(formatLatency(0)).toBe('<1 s')
    expect(formatLatency(-3)).toBe('<1 s')
  })

  it('no imprime "60.0 s" al redondear el último tramo de segundos', () => {
    expect(formatLatency(59.99)).toBe('1 min')
  })

  it('redondea los minutos hacia el entero más cercano', () => {
    expect(formatLatency(90)).toBe('2 min')
    expect(formatLatency(600)).toBe('10 min')
  })
})

describe('escalationLabel', () => {
  it('traduce los tres niveles de escalación', () => {
    expect(escalationLabel('immediate')).toBe('Immediate consult')
    expect(escalationLabel('async')).toBe('Asynchronous consult')
    expect(escalationLabel('autonomous')).toBe('Autonomous protocol')
  })
})

describe('distanceLabel', () => {
  it('traduce las tres distancias', () => {
    expect(distanceLabel('leo')).toBe('LEO')
    expect(distanceLabel('moon')).toBe('Moon')
    expect(distanceLabel('mars')).toBe('Mars')
  })
})
