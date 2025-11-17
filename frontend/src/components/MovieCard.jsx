// frontend/src/components/MovieCard.jsx
import React from 'react'

function abbrevNumber(num) {
  if (!num && num !== 0) return ''
  if (num < 1000) return String(num)
  if (num < 1_000_000) return `${Math.round((num / 1000) * 10) / 10}k`
  return `${Math.round((num / 1_000_000) * 10) / 10}M`
}

export default function MovieCard({ movie }) {
  const title = movie?.title || 'Untitled'
  const raw = movie?.posterUrl || '/placeholder.png'
  const posterSrc = raw && raw.startsWith('http') ? raw : (raw && raw.startsWith('/') ? `${location.origin}${raw}` : `${location.origin}/${raw}`)

  // Normalize ratings to 0-10 scale for display
  function normalizeRating(r) {
    if (r == null) return null
    const n = Number(r)
    if (Number.isNaN(n)) return null
    if (n <= 10) return n
    if (n <= 100) return n / 10
    if (n <= 1000) return n / 100
    let out = n
    while (out > 10) out = out / 10
    return out
  }

  const numericBadge = (typeof movie?.rating === 'number') ? normalizeRating(movie.rating) : (typeof movie?.vote_average === 'number' ? normalizeRating(movie.vote_average) : null)
  const badge = numericBadge != null ? Number(numericBadge).toFixed(1) : (movie?.watchers ? abbrevNumber(movie.watchers) : '')

  return (
    <article className="card" style={{ cursor:'pointer' }} onClick={() => window.dispatchEvent(new CustomEvent('movie:open', { detail:{ __movie_open__: true, movie } }))}>
      <div className="poster">
        <img src={posterSrc} alt={`${title} poster`} loading="lazy" />
        {badge ? <div className="rating-badge">{badge}</div> : null}
        <div className="overlay">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6}}>
            <strong style={{fontSize:14}}>{title}</strong>
            <div style={{fontSize:12, color:'#ddd'}}>{movie?.year}</div>
          </div>
          <div style={{fontSize:13, color:'#ddd', marginBottom:8, maxHeight:48, overflow:'hidden', textOverflow:'ellipsis'}}>
            {movie?.overview || movie?.description || 'No description available.'}
          </div>
          <div style={{display:'flex', gap:8}}>
            <button style={{padding:'6px 8px', borderRadius:6, border:'none', fontWeight:700, cursor:'pointer', background:'#fff', color:'#000'}}>Play</button>
            <button style={{padding:'6px 8px', borderRadius:6, border:'none', background:'rgba(255,255,255,0.08)', color:'#fff'}}>My List</button>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="card-title">{title}</div>
        <div className="card-meta">{(movie?.genres || []).slice(0,2).join(', ')}</div>
      </div>
    </article>
  )
}
