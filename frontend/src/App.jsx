// frontend/src/App.jsx
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import HeroStrip from './components/HeroStrip'
import FiltersPanel from './components/FiltersPanel'
import Recommendations from './components/Recommendations'
import MovieModal from './components/MovieModal'
import HeroBanner from './components/HeroBanner'
import Login from './components/Login'
import Register from './components/Register'
import { useAuth } from './AuthContext'
import AuthModal from './components/AuthModal'
// styles are imported in `main.jsx`
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function App() {
  const { user, logout } = useAuth()
  const [filters, setFilters] = useState({ genres: [], minRating: 0, query: '' })
  const [hero, setHero] = useState(null)
  const [modalMovie, setModalMovie] = useState(null)
  const [authMode, setAuthMode] = useState(null) // 'login' | 'register' | null

  // Load hero movie (choose top rated/trending) on mount
  useEffect(() => {
    let mounted = true
    async function loadHero() {
      try {
        const res = await axios.get(`${API_BASE}/api/external/trending`)
        if (!mounted) return
        const data = Array.isArray(res.data) ? res.data : []

        if (data.length) {
          // normalize rating candidate: prefer vote_average -> rating -> watchers scaled
          function normalizeRating(n) {
            if (n == null) return 0
            const v = Number(n)
            if (Number.isNaN(v)) return 0
            if (v <= 10) return v
            if (v <= 100) return v / 10
            if (v <= 1000) return v / 100
            let out = v
            while (out > 10) out = out / 10
            return out
          }

          const sorted = data
            .slice()
            .sort((a, b) => {
              const scoreA = typeof a.vote_average === 'number'
                ? normalizeRating(a.vote_average)
                : (typeof a.rating === 'number' ? normalizeRating(a.rating) : (a.watchers ? Math.log10(a.watchers + 1) * 2 : 0))
              const scoreB = typeof b.vote_average === 'number'
                ? normalizeRating(b.vote_average)
                : (typeof b.rating === 'number' ? normalizeRating(b.rating) : (b.watchers ? Math.log10(b.watchers + 1) * 2 : 0))
              return scoreB - scoreA
            })
          setHero(sorted[0])
        }
      } catch (err) {
        console.warn('hero load failed', err)
      }
    }
    loadHero()
    return () => (mounted = false)
  }, [])

  // Global listener: when a MovieCard dispatches 'movie:open' we show modal
  useEffect(() => {
    function handler(e) {
      if (e?.detail?.__movie_open__) {
        setModalMovie(e.detail.movie)
      }
    }
    window.addEventListener('movie:open', handler)
    return () => window.removeEventListener('movie:open', handler)
  }, [])

  return (
    <div className="app-root">
      {/* Header */}
      <header className="app-header">
        <div className="brand">MovieMate</div>
        <div className="search-wrap">
          <input
            className="search-input"
            placeholder="Search movies..."
            value={filters.query}
            onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          />
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {user ? (
            <>
              <div style={{ color: '#fff', alignSelf: 'center' }}>{user.name || user.email}</div>
              <button className="btn btn-ghost" onClick={() => logout()}>Sign out</button>
            </>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setAuthMode('login')}>Sign in</button>
              <button className="btn btn-primary" onClick={() => setAuthMode('register')}>Create account</button>
            </>
          )}
        </div>
      </header>

      {/* Hero banner area - full width banner (moved outside centered container) */}
      <main>
        <section className="hero">
          {/* Full-bleed banner or fallback strip */}
          {hero ? (
            <HeroBanner movie={hero} onOpen={(m) => setModalMovie(m)} />
          ) : (
            <div className="hero-rect">
              <HeroStrip count={12} />
            </div>
          )}

          {/* Centered content container below/over the banner */}
          <div className="hero-inner">
            <div className="hero-text">
              <h1>Personalized picks for you</h1>
              <p className="muted">
                We surface movies you're likely to enjoy. Use filters to refine results. Click a poster for details.
              </p>

              <div style={{ marginTop: 14 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    if (hero) setModalMovie(hero)
                  }}
                >
                  Play
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ marginLeft: 8 }}
                  onClick={() => {
                    if (hero) setModalMovie(hero)
                  }}
                >
                  More Info
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="filters-section">
          <FiltersPanel filters={filters} setFilters={setFilters} />
        </section>

        {/* Recommendations */}
        <section className="section">
          <h2 style={{ color: '#fff', marginBottom: 14 }}>Recommended</h2>
          <Recommendations filters={filters} />
        </section>
      </main>

      {/* Modal */}
      <MovieModal movie={modalMovie} onClose={() => setModalMovie(null)} />

      {authMode && (
        <AuthModal onClose={() => setAuthMode(null)}>
          {authMode === 'login' ? (
            <Login onSuccess={() => setAuthMode(null)} />
          ) : (
            <Register onSuccess={() => setAuthMode(null)} />
          )}
        </AuthModal>
      )}
    </div>
  )
}

// App is a plain component. Mounting is handled in `main.jsx`.
