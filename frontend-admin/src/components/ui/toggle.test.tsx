import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from '@/components/ui/toggle'

describe('Toggle', () => {
  it('refleja el estado habilitado con aria-checked', () => {
    render(<Toggle enabled label="Notificaciones" onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('refleja el estado deshabilitado', () => {
    render(<Toggle enabled={false} label="Off" onChange={() => {}} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('muestra el label', () => {
    render(<Toggle enabled label="Modo oscuro" onChange={() => {}} />)
    expect(screen.getByText('Modo oscuro')).toBeInTheDocument()
  })

  it('llama onChange con el valor inverso al hacer clic', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle enabled onChange={onChange} />)

    // Componente controlado: cada clic emite !enabled
    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it('no dispara onChange cuando está deshabilitado', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle enabled disabled onChange={onChange} />)

    await user.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
