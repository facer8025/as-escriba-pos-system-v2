import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renderiza children y aplica variante por defecto', () => {
    render(<Button>Guardar</Button>)
    const btn = screen.getByRole('button', { name: 'Guardar' })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain('bg-escriba-600')
  })

  it('aplica la variante danger', () => {
    render(<Button variant="danger">Eliminar</Button>)
    expect(screen.getByRole('button', { name: 'Eliminar' }).className).toContain('bg-danger-500')
  })

  it('deshabilita el botón con disabled', () => {
    render(<Button disabled>Inactivo</Button>)
    expect(screen.getByRole('button', { name: 'Inactivo' })).toBeDisabled()
  })

  it('muestra spinner y deshabilita cuando loading', () => {
    render(<Button loading>Procesando</Button>)
    const btn = screen.getByRole('button', { name: 'Procesando' })
    expect(btn).toBeDisabled()
    expect(btn.querySelector('svg.animate-spin')).toBeInTheDocument()
  })

  it('dispara onClick al hacer clic', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Clic</Button>)
    await user.click(screen.getByRole('button', { name: 'Clic' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('no dispara onClick cuando está deshabilitado', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick} disabled>No</Button>)
    await user.click(screen.getByRole('button', { name: 'No' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})
