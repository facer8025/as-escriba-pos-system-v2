import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, StatusBadge } from '@/components/ui/badge'

describe('Badge', () => {
  it('renderiza children con variante default', () => {
    render(<Badge>Nuevo</Badge>)
    const badge = screen.getByText('Nuevo')
    expect(badge.className).toContain('bg-escriba-50')
  })

  it('aplica variante success', () => {
    render(<Badge variant="success">Activo</Badge>)
    expect(screen.getByText('Activo').className).toContain('bg-success-50')
  })

  it('aplica variante danger', () => {
    render(<Badge variant="danger">Error</Badge>)
    expect(screen.getByText('Error').className).toContain('bg-danger-50')
  })

  it('permite className adicional', () => {
    render(<Badge className="custom-class">X</Badge>)
    expect(screen.getByText('X').className).toContain('custom-class')
  })
})

describe('StatusBadge', () => {
  it('mapea ACTIVE a success', () => {
    render(<StatusBadge status="ACTIVE" />)
    expect(screen.getByText('ACTIVE').className).toContain('bg-success-50')
  })

  it('mapea SUSPENDED a danger', () => {
    render(<StatusBadge status="SUSPENDED" />)
    expect(screen.getByText('SUSPENDED').className).toContain('bg-danger-50')
  })

  it('mapea OPEN a info', () => {
    render(<StatusBadge status="OPEN" />)
    expect(screen.getByText('OPEN').className).toContain('bg-info-50')
  })

  it('muestra label personalizado si se provee', () => {
    render(<StatusBadge status="ACTIVE" label="Activa" />)
    expect(screen.getByText('Activa')).toBeInTheDocument()
    expect(screen.queryByText('ACTIVE')).not.toBeInTheDocument()
  })

  it('usa neutral para estados desconocidos', () => {
    render(<StatusBadge status="MYSTERY" />)
    expect(screen.getByText('MYSTERY').className).toContain('bg-neutral-100')
  })
})
