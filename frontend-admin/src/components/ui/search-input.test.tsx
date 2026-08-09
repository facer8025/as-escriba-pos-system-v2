import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchInput } from '@/components/ui/search-input'

describe('SearchInput', () => {
  it('muestra el placeholder por defecto', () => {
    render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument()
  })

  it('muestra un placeholder personalizado', () => {
    render(<SearchInput value="" onChange={() => {}} placeholder="Buscar empresa..." />)
    expect(screen.getByPlaceholderText('Buscar empresa...')).toBeInTheDocument()
  })

  it('refleja el valor controlado', () => {
    render(<SearchInput value="ESCRIBA" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('ESCRIBA')
  })

  it('llama onChange con el texto escrito', () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'café' } })
    expect(onChange).toHaveBeenCalledWith('café')
  })
})
