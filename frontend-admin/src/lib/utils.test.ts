import { describe, it, expect } from 'vitest'
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  generateId,
  getAdminRoleBadgeClass,
  getAdminRoleName,
  getTenantStatusBadgeClass,
  getTenantStatusColor,
} from '@/lib/utils'

describe('utils', () => {
  describe('cn', () => {
    it('combina clases y resuelve conflictos de tailwind-merge', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white')
    })

    it('filtra valores falsy', () => {
      expect(cn('a', null, undefined, false, 'b')).toBe('a b')
    })
  })

  describe('formatCurrency', () => {
    it('formatea en pesos colombianos sin decimales', () => {
      expect(formatCurrency(150000)).toContain('150.000')
      expect(formatCurrency(1000)).toContain('1.000')
    })

    it('formatea cero', () => {
      expect(formatCurrency(0)).toContain('0')
      expect(formatCurrency(0)).toContain('$')
    })
  })

  describe('formatDate / formatDateTime', () => {
    it('formatea una fecha en formato es-CO', () => {
      const d = new Date(2026, 5, 15) // 15 jun 2026
      expect(formatDate(d)).toContain('jun')
      expect(formatDate('2026-06-15')).toContain('jun')
    })

    it('formatDateTime incluye hora', () => {
      const d = new Date(2026, 5, 15, 14, 30)
      expect(formatDateTime(d)).toContain('jun')
      expect(formatDateTime(d)).toContain(':')
    })
  })

  describe('formatRelativeTime', () => {
    it('devuelve "ahora" para fechas recientes', () => {
      expect(formatRelativeTime(new Date())).toBe('ahora')
    })

    it('devuelve minutos para < 1h', () => {
      const past = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatRelativeTime(past)).toBe('hace 5 min')
    })

    it('devuelve horas para < 24h', () => {
      const past = new Date(Date.now() - 3 * 60 * 60 * 1000)
      expect(formatRelativeTime(past)).toBe('hace 3h')
    })

    it('devuelve días para < 7d', () => {
      const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      expect(formatRelativeTime(past)).toBe('hace 2d')
    })
  })

  describe('generateId', () => {
    it('genera un id único no vacío', () => {
      const a = generateId()
      const b = generateId()
      expect(a).toBeTruthy()
      expect(a).not.toBe(b)
    })
  })

  describe('getAdminRoleName', () => {
    it('mapea códigos de rol a nombres legibles', () => {
      expect(getAdminRoleName('SA')).toBe('Super Admin')
      expect(getAdminRoleName('AC')).toBe('Admin Comercial')
      expect(getAdminRoleName('AF')).toBe('Admin Financiero')
      expect(getAdminRoleName('ST')).toBe('Soporte Técnico')
      expect(getAdminRoleName('AU')).toBe('Auditor')
    })

    it('devuelve el código si no está mapeado', () => {
      expect(getAdminRoleName('XX')).toBe('XX')
    })
  })

  describe('getAdminRoleBadgeClass', () => {
    it('mapea roles conocidos a clases de badge', () => {
      expect(getAdminRoleBadgeClass('SA')).toBe('admin-badge-sa')
      expect(getAdminRoleBadgeClass('AC')).toBe('admin-badge-ac')
    })

    it('usa clase neutral para roles desconocidos', () => {
      expect(getAdminRoleBadgeClass('XX')).toBe('bg-neutral-100 text-neutral-700')
    })
  })

  describe('getTenantStatusColor', () => {
    it('mapea estados de empresa a colores semáforo', () => {
      expect(getTenantStatusColor('ACTIVE')).toBe('bg-success-500')
      expect(getTenantStatusColor('TRIAL')).toBe('bg-warning-500')
      expect(getTenantStatusColor('SUSPENDED')).toBe('bg-danger-500')
      expect(getTenantStatusColor('CANCELLED')).toBe('bg-neutral-400')
    })

    it('usa neutral para estados desconocidos', () => {
      expect(getTenantStatusColor('UNKNOWN')).toBe('bg-neutral-400')
    })
  })

  describe('getTenantStatusBadgeClass', () => {
    it('mapea estados a clases con soporte dark mode', () => {
      expect(getTenantStatusBadgeClass('ACTIVE')).toContain('bg-success-50')
      expect(getTenantStatusBadgeClass('TRIAL')).toContain('bg-warning-50')
      expect(getTenantStatusBadgeClass('SUSPENDED')).toContain('bg-danger-50')
      expect(getTenantStatusBadgeClass('CANCELLED')).toContain('bg-neutral-100')
    })
  })
})
