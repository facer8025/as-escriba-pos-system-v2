import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertTriangle, Info } from 'lucide-react'

/**
 * Sistema simple de notificaciones toast sin dependencias externas.
 * Útil para reemplazar alert() en el frontend admin.
 */
let toastId = 0

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

let toasts: Toast[] = []
let listeners: Array<(toasts: Toast[]) => void> = []

function notify() {
  listeners.forEach(l => l([...toasts]))
}

export function showToast(message: string, type: Toast['type'] = 'info') {
  const id = ++toastId
  toasts = [...toasts, { id, message, type }]
  notify()
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id)
    notify()
  }, 4000)
}

export function subscribe(fn: (toasts: Toast[]) => void) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

export function getToasts() { return toasts }

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([])
  useEffect(() => subscribe(setItems), [])

  if (items.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2">
      {items.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className={`px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 ${
            t.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            t.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
            t.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}
        >
          {t.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
           t.type === 'error' ? <AlertTriangle className="w-4 h-4" /> :
           t.type === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
           <Info className="w-4 h-4" />}
          {t.message}
        </motion.div>
      ))}
    </div>
  )
}
