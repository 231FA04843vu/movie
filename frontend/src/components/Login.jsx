// frontend/src/components/Login.jsx
import React, { useState } from 'react'
import { useAuth } from '../AuthContext'

export default function Login({ onSuccess }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      if (typeof onSuccess === 'function') onSuccess()
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h3>Sign in</h3>
      {error && <div className="auth-err">{error}</div>}
      <input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit" disabled={loading}>{loading ? 'Signing...' : 'Sign in'}</button>
    </form>
  )
}
