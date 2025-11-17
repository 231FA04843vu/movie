// frontend/src/components/Recommendations.jsx
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import MovieCard from './MovieCard'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function normalizeMovie(m){
  // Trakt structure: item.movie or raw from TMDb/seed
  const movie = m.movie || m
  const tmdb = (movie.ids && movie.ids.tmdb) || movie.tmdb || null

  // Determine rating: prefer vote_average (TMDb), then movie.rating, then undefined
  const rawRating = typeof movie.vote_average === 'number' ? movie.vote_average
             : (typeof movie.rating === 'number' ? movie.rating : undefined)

  function normalizeRating(r) {
    if (r == null) return undefined
    const n = Number(r)
    if (Number.isNaN(n)) return undefined
    if (n <= 10) return n
    if (n <= 100) return n / 10
    if (n <= 1000) return n / 100
    let out = n
    while (out > 10) out = out / 10
    return out
  }

  let rating = normalizeRating(rawRating)

  // If no rating and we have watchers count, create a pseudo rating: watchers scaled -> 0-10
  if (rating === undefined && typeof m.watchers === 'number') {
    // simple scale: log scale so huge watcher numbers don't blow up
    rating = Math.max(0, Math.min(10, Math.log10(m.watchers + 1) * 2)) // rough mapping
  }

  return {
    title: movie.title || movie.name || 'Untitled',
    year: movie.year || (movie.release_date ? movie.release_date.slice(0,4) : ''),
    genres: movie.genres || movie.genre || movie.genre_ids || [],
    overview: movie.overview || movie.description || '',
    posterUrl: movie.posterUrl || (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : (movie.fanartPosters && movie.fanartPosters[0]) || null),
    rating,
    vote_average: movie.vote_average,
    watchers: m.watchers || null,
    tmdb,
    ids: movie.ids || (tmdb ? { tmdb } : {}),
    trakt_id: movie.ids?.trakt || null,
    _raw: movie
  }
}

export default function Recommendations({ filters = {} }) {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const carouselRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await axios.get(`${API_BASE}/api/external/trending`)
        let data = Array.isArray(res.data) ? res.data : []
        // normalize
        const normalized = data.map(normalizeMovie)
        if (mounted) setMovies(normalized)
      } catch (err) {
        console.error('Failed load', err)
        setError('Failed to load movies')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => (mounted = false)
  }, [])

  useEffect(() => {
    function check() {
      const el = carouselRef.current
      if (!el) return
      setCanScrollLeft(el.scrollLeft > 0)
      setCanScrollRight(el.scrollWidth > el.clientWidth + el.scrollLeft + 2)
    }
    check()
    window.addEventListener('resize', check)
    const el = carouselRef.current
    if (el) el.addEventListener('scroll', check)
    return () => {
      window.removeEventListener('resize', check)
      if (el) el.removeEventListener('scroll', check)
    }
  }, [movies])

  function applyFilters(list) {
    let out = list.slice()
    const q = (filters.query || '').trim().toLowerCase()
    if (q) out = out.filter(m => (m.title || '').toLowerCase().includes(q) || (m.overview || '').toLowerCase().includes(q))

    if (filters.genres && filters.genres.length) {
      out = out.filter(m => {
        if (!m.genres || !m.genres.length) return false
        // allow case-insensitive partial matches
        const gm = m.genres.map(x => String(x).toLowerCase())
        return filters.genres.every(g => gm.includes(g.toLowerCase()))
      })
    }

    if (typeof filters.minRating === 'number' && filters.minRating > 0) {
      out = out.filter(m => {
        if (typeof m.rating === 'number') return m.rating >= filters.minRating
        // if no numeric rating, keep the movie (so slider doesn't hide everything)
        return true
      })
    }

    return out
  }

  const visibleMovies = applyFilters(movies)

  const scrollByWidth = (dir = 1) => {
    const el = carouselRef.current
    if (!el) return
    const amount = Math.round(el.clientWidth * 0.85)
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>
  if (error) return <div style={{ padding: 20, color: 'salmon' }}>{error}</div>
  if (!visibleMovies.length) return <div style={{ padding: 20, color: '#ccc' }}>No movies found.</div>

  return (
    <div style={{ position: 'relative', paddingTop: 8 }}>
      <button onClick={() => scrollByWidth(-1)} className="carousel-arrow left" style={{ display: canScrollLeft ? 'flex' : 'none' }}>‹</button>
      <button onClick={() => scrollByWidth(1)} className="carousel-arrow right" style={{ display: canScrollRight ? 'flex' : 'none' }}>›</button>

      <div ref={carouselRef} className="carousel" role="list" tabIndex={0}>
        {visibleMovies.map((m, i) => (
          <div className="carousel-item" key={m.tmdb || `${m.title}-${i}`}>
            <MovieCard movie={m} />
          </div>
        ))}
      </div>
    </div>
  )
}
