// frontend/src/components/MovieModal.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import PropTypes from 'prop-types'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export default function MovieModal({ movie, onClose }) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Helper to choose an identifier to fetch details with.
  function getPrimaryId(m) {
    if (!m) return null
    // common fields: id, tmdb_id, trakt_id, ids?.trakt, ids?.tmdb
    if (m.ids && (m.ids.trakt || m.ids.tmdb || m.ids.imdb)) {
      return m.ids.trakt || m.ids.tmdb || m.ids.imdb
    }
    if (m.trakt_id) return m.trakt_id
    if (m.tmdb_id) return m.tmdb_id
    if (m.id) return m.id
    return null
  }

  useEffect(() => {
    if (!movie) {
      setDetails(null)
      setError(null)
      setLoading(false)
      return
    }

    // fetch details from backend (preferred)
    async function fetchDetails() {
      setLoading(true)
      setError(null)
      setDetails(null)

      // try several endpoints — adapt to what your backend exposes.
      const id = getPrimaryId(movie)

      // build candidate urls to try in order
      const candidates = []
      if (id) {
        // prefer dedicated details route; try trakt-style then tmdb
        candidates.push(`${API_BASE}/api/external/movie/${id}`)       // generic details route
        candidates.push(`${API_BASE}/api/external/details/${id}`)     // alternate
        candidates.push(`${API_BASE}/api/movies/${id}`)               // stored movie in mongodb
      }
      // fallback to pass-through trending details (some apps include full details in trending payload)
      candidates.push(`${API_BASE}/api/external/trending`) // we can search locally if needed

      let got = null
      for (let url of candidates) {
        try {
          const res = await axios.get(url)
          // some endpoints return array or object
          const data = Array.isArray(res.data) ? res.data[0] : res.data
          if (data && (data.overview || data.description || data.cast || data.genres)) {
            got = data
            break
          }
        } catch (err) {
          // ignore this candidate and continue trying others
        }
      }

      if (!got) {
        // as final fallback, try enrich using the movie object itself (often already has enough)
        got = movie
      }

      setDetails(got)
      setLoading(false)
    }

    fetchDetails()
  }, [movie])

  if (!movie) return null

  // read from details if present else from movie
  const d = details || movie || {}
  const title = d.title || d.name || movie.title || 'Untitled'
  const year = d.year || d.release_date || d.releaseYear || (movie.release_date ? movie.release_date.slice(0,4) : '')
  const desc = d.overview || d.description || d.plot || 'No description available.'
  const poster =
    (d.posterUrl && (d.posterUrl.startsWith('http') ? d.posterUrl : `${location.origin}${d.posterUrl}`)) ||
    (d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : (movie.posterUrl ? (movie.posterUrl.startsWith('http') ? movie.posterUrl : `${location.origin}${movie.posterUrl}`) : '/placeholder.png'))
  const backdrop =
    (d.backdrop || d.backdropUrl) ? (d.backdrop && d.backdrop.startsWith('http') ? d.backdrop : `${location.origin}${d.backdrop || d.backdropUrl}`) : null

  // Genres array
  const genres = d.genres || d.genre || d.categories || movie.genres || []

  // Ratings
  const rawRating = d.vote_average || d.rating || d.score || null
  function normalizeRating(r) {
    if (r == null) return null
    const n = Number(r)
    if (Number.isNaN(n)) return null
    if (n <= 10) return n
    // Common cases: 0-100 (percent) or 0-1000 (scaled) — map to 0-10
    if (n <= 100) return n / 10
  
    // Fallback: repeatedly scale down by 10 until within 0-10
    let out = n
    while (out > 10) out = out / 10
    return out
  }
  const rating = normalizeRating(rawRating)

  // runtime
  const runtime = d.runtime || d.duration || d.run_time || null

  // cast / crew
  // Expect d.cast = [{name, character, profile_path, order}] or d.credits?.cast
  const cast = d.cast || (d.credits && d.credits.cast) || []
  const crew = d.crew || (d.credits && d.credits.crew) || []
  const director = (Array.isArray(crew) && crew.find(c => (c.job || c.role || '').toLowerCase().includes('director'))) || null

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        {/* Left poster */}
        <div className="modal-left">
          <img src={poster} alt={`${title} poster`} className="modal-poster" onError={(e)=>{e.target.src='/placeholder.png'}} />
        </div>

        {/* Right content */}
        <div className="modal-right">
          <div className="modal-header">
            <h2 className="modal-title">{title} {year ? <span className="muted">({String(year).slice(0,4)})</span> : null}</h2>
            <div className="modal-meta">
              {rating ? <span className="badge">★ {Number(rating).toFixed(1)}</span> : null}
              {runtime ? <span className="muted">{runtime} min</span> : null}
              {genres && genres.length ? <span className="muted">{(Array.isArray(genres) ? genres.join(', ') : genres)}</span> : null}
            </div>
          </div>

          <div className="modal-body">
            {loading ? (
              <p>Loading details…</p>
            ) : error ? (
              <p className="error">Failed to load details</p>
            ) : (
              <>
                <p className="modal-desc">{desc}</p>

                {/* Director */}
                {director ? (
                  <p><strong>Director:</strong> {director.name || director.original_name || director.crew || director.job}</p>
                ) : null}

                {/* Cast */}
                {cast && cast.length ? (
                  <div className="cast-list">
                    <h4>Cast</h4>
                    <div className="cast-scroll">
                      {cast.slice(0,12).map((c, idx) => (
                        <div className="cast-item" key={c.id || c.name || idx}>
                          <img
                            className="cast-thumb"
                            src={c.profile_path ? (c.profile_path.startsWith('http') ? c.profile_path : `https://image.tmdb.org/t/p/w185${c.profile_path}`) : '/person-placeholder.png'}
                            alt={c.name}
                            onError={(e)=>{e.target.src='/person-placeholder.png'}}
                          />
                          <div className="cast-name">{c.name}</div>
                          {c.character ? <div className="cast-role muted">{c.character}</div> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="modal-actions">
            <button className="btn btn-primary" onClick={() => { /* implement play action if needed */ }}>Play</button>
            <button className="btn btn-ghost" onClick={() => { /* add to list action */ }}>Add to list</button>
            <button className="btn" onClick={onClose} style={{ marginLeft: 'auto' }}>Close</button>
          </div>
        </div>
      </div>

      <style>{`
        /* Basic modal styles (you can merge with your existing styles.css) */
        .modal-overlay {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          background: rgba(0,0,0,0.6);
          padding: 24px;
        }
        .modal-card {
          background: linear-gradient(180deg, #111, #0b0b0b);
          max-width: 1060px;
          width: 100%;
          border-radius: 10px;
          display: flex;
          overflow: hidden;
          box-shadow: 0 40px 120px rgba(0,0,0,0.7);
        }
        .modal-left {
          width: 360px;
          min-width: 280px;
          background: #111;
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 16px;
        }
        .modal-poster {
          width: 100%;
          height: auto;
          border-radius: 8px;
          object-fit: cover;
          display:block;
        }
        .modal-right {
          padding: 26px;
          flex:1;
          color: #fff;
          display:flex;
          flex-direction:column;
        }
        .modal-title { margin: 0 0 6px 0; font-size: 32px; font-weight:800; }
        .modal-meta { display:flex; gap:12px; align-items:center; margin-bottom: 12px; }
        .badge { background:#222; padding:6px 10px; border-radius:8px; font-weight:700; color:#fff; }
        .modal-desc { color:#ddd; line-height:1.5; }
        .cast-list { margin-top: 16px; }
        .cast-scroll { display:flex; gap:12px; overflow-x:auto; padding-top:8px; padding-bottom:6px; }
        .cast-item { width:96px; text-align:center; }
        .cast-thumb { width: 96px; height: 140px; object-fit:cover; border-radius:6px; background:#222; }
        .cast-name { font-size:13px; margin-top:6px; font-weight:700; }
        .cast-role { font-size:12px; color:#bbb; margin-top:2px; }
        .modal-actions { margin-top:auto; display:flex; gap:12px; align-items:center; }
        .muted { color:#bdbdbd; font-weight:400; }
        .error { color:#ff6b6b; }
        @media (max-width: 900px) {
          .modal-card { flex-direction: column; max-width: 92vw; }
          .modal-left { width:100%; min-width:auto; padding: 12px; }
          .modal-poster { height: 380px; object-fit:contain; }
        }
      `}</style>
    </div>
  )
}

MovieModal.propTypes = {
  movie: PropTypes.object,
  onClose: PropTypes.func.isRequired
}
