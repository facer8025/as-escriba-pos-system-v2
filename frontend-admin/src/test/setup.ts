import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Limpieza automática del DOM después de cada test
afterEach(() => {
  cleanup()
  sessionStorage.clear()
})
