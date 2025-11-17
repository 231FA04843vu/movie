// frontend/src/components/HeroStrip.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

function posterUrl(raw) {
  if (!raw) return '/placeholder.png'
  if (raw.startsWith('http')) return raw
  if (raw.startsWith('/')) return `${location.origin}${raw}`
  return `${location.origin}/${raw}`
}

export default function HeroStrip({ count = 12 }) {
  const [posters, setPosters] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await axios.get(`${API_BASE}/api/external/trending`)
        if (!mounted) return
        const data = Array.isArray(res.data) ? res.data : []
        // map to poster urls and filter nulls
        const urls = data.map(m => m.posterUrl || (m.fanartPosters && m.fanartPosters[0]) || (m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null))
                         .filter(Boolean)
        // limit number and duplicate for continuous scroll
        const limited = urls.slice(0, count)
        // if not enough posters, fill with placeholders to avoid empty loop
        while (limited.length < 6) limited.push('/placeholder.png')
        setPosters(limited)
      } catch (err) {
        console.error('HeroStrip load error', err)
        setPosters(['/placeholder.png','/placeholder.png','/placeholder.png'])
      }
    }
    load()
    return () => { mounted = false }
  }, [count])

  if (!posters || posters.length === 0) {
    return <div className="hero-strip-empty">No new posters</div>
  }

  // We duplicate the array to create a seamless loop: [A,B,C... A,B,C...]
  const loop = [...posters, ...posters]

  return (
    <div className="hero-strip-wrapper" aria-hidden="false">
      <div className="hero-strip" role="list">
        {loop.map((p, i) => (
          <div className="hero-strip-item" role="listitem" key={`hero-${i}`}>
            <img src={posterUrl(p)} alt={`poster-${i}`} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  )
}
