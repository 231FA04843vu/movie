import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function AuthModal({ children, onClose }) {
  useEffect(() => {
    // prevent background scroll while modal is open
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const modal = (
    <div className="auth-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="auth-modal__inner" onClick={(e) => e.stopPropagation()}>
        <div className="auth-modal__close-wrap">
          <button className="auth-modal__close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}
