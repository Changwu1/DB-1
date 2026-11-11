'use client'

import { useState, useEffect } from 'react'

// Only renders in development builds
export default function DevPanel() {
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (globalThis.__DEV_DATE__) setValue(globalThis.__DEV_DATE__)
  }, [])

  if (process.env.NODE_ENV !== 'development') return null

  function apply() {
    if (value) {
      globalThis.__DEV_DATE__ = value
      document.cookie = `__dev_date__=${encodeURIComponent(value)}; path=/`
    } else {
      delete globalThis.__DEV_DATE__
      document.cookie = '__dev_date__=; path=/; max-age=0'
    }
    window.location.reload()
  }

  function clear() {
    delete globalThis.__DEV_DATE__
    document.cookie = '__dev_date__=; path=/; max-age=0'
    setValue('')
    window.location.reload()
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 12,
        right: 12,
        zIndex: 9999,
        background: '#1e1e2e',
        color: '#cdd6f4',
        borderRadius: 8,
        padding: open ? 12 : 4,
        fontSize: 12,
        fontFamily: 'monospace',
        boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
        minWidth: open ? 240 : 'auto',
      }}
    >
      {open ? (
        <>
          <div style={{ marginBottom: 6, fontWeight: 'bold' }}>
            🗓 Simulated date
          </div>
          <input
            type="datetime-local"
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{
              background: '#313244',
              color: '#cdd6f4',
              border: '1px solid #585b70',
              borderRadius: 4,
              padding: '2px 6px',
              width: '100%',
              marginBottom: 6,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={apply}
              style={{ flex: 1, background: '#89b4fa', color: '#1e1e2e', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
            >
              Apply
            </button>
            <button
              onClick={clear}
              style={{ flex: 1, background: '#f38ba8', color: '#1e1e2e', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
            >
              Reset
            </button>
            <button
              onClick={() => setOpen(false)}
              style={{ background: '#585b70', color: '#cdd6f4', border: 'none', borderRadius: 4, padding: '3px 8px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          {globalThis.__DEV_DATE__ && (
            <div style={{ marginTop: 6, color: '#a6e3a1' }}>
              Active: {new Date(globalThis.__DEV_DATE__).toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={() => setOpen(true)}
          title="Simulated date"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cdd6f4', fontSize: 16 }}
        >
          🗓
        </button>
      )}
    </div>
  )
}
