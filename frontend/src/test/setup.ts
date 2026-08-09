import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Limpieza automática del DOM y storage después de cada test
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
