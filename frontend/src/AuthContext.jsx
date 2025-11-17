// frontend/src/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('mm_token') || null)
  const [loading, setLoading] = useState(!!token)

  useEffect(() => {
    if (!token) { setUser(null); setLoading(false); return }
    setLoading(true)
    async function load() {
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        setUser(res.data.user)
      } catch (err) {
        console.warn('auth me failed', err)
        setToken(null)
        localStorage.removeItem('mm_token')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password })
    const { token: t, user } = res.data
    setToken(t)
    localStorage.setItem('mm_token', t)
    setUser(user)
    return user
  }

  const register = async (name, email, password) => {
    const res = await axios.post(`${API_BASE}/api/auth/register`, { name, email, password })
    const { token: t, user } = res.data
    setToken(t)
    localStorage.setItem('mm_token', t)
    setUser(user)
    return user
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('mm_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
