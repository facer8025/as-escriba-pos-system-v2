import { describe, it, expect } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  getInitials,
  getStockStatus,
} from '@/lib/utils'

describe('utils (panel cliente)', () => {
  describe('cn', () => {
    it('combina clases y filtra falsy', () => {
      expect(cn('a', null, undefined, false, 'b')).toBe('a b')
    })
  })

  describe('formatCurrency', () => {
    it('formatea en COP con separador de miles', () => {
      expect(formatCurrency(150000)).toContain('150.000')
    })

    it('respeta moneda configurable', () => {
      expect(formatCurrency(10, 'USD')).toContain('US$')
    })
  })

  describe('formatDate', () => {
    it('retorna vacío para fecha nula', () => {
      expect(formatDate('')).toBe('')
    })

    it('formato corto dd/mm/yyyy', () => {
      const d = new Date(2026, 5, 15)
      expect(formatDate(d, 'short')).toBe('15/06/2026')
    })

    it('formato largo incluye hora', () => {
      const d = new Date(2026, 5, 15, 14, 30)
      expect(formatDate(d, 'long')).toContain('junio')
      expect(formatDate(d, 'long')).toContain(':')
    })

    it('formato relativo: Ahora', () => {
      expect(formatDate(new Date(), 'relative')).toBe('Ahora')
    })

    it('formato relativo: minutos', () => {
      const past = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatDate(past, 'relative')).toBe('Hace 5 min')
    })
  })

  describe('formatNumber', () => {
    it('formatea con separador de miles es-CO', () => {
      expect(formatNumber(1500000)).toContain('1.500.000')
    })
  })

  describe('getStockStatus', () => {
    it('sin stock', () => {
      expect(getStockStatus(0, 5, 100)).toEqual({ status: 'out', color: 'text-red-600', label: 'Sin stock' })
    })

    it('stock bajo', () => {
      expect(getStockStatus(5, 10, 100).status).toBe('low')
    })

    it('stock normal', () => {
      expect(getStockStatus(50, 10, 100).status).toBe('normal')
    })

    it('stock excedido', () => {
      expect(getStockStatus(150, 10, 100).status).toBe('over')
    })
  })

  describe('getInitials', () => {
    it('retorna las 2 primeras iniciales en mayúscula', () => {
      expect(getInitials('Juan Pérez')).toBe('JP')
      expect(getInitials('maria gomez')).toBe('MG')
    })

    it('maneja un solo nombre', () => {
      expect(getInitials('Ana')).toBe('A')
    })
  })
})
