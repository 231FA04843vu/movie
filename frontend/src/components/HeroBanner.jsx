// frontend/src/components/HeroBanner.jsx
import React from 'react'

/**
 * Convert a possibly-relative poster/backdrop value into an absolute URL.
 * Accepts:
 * - full http(s) URLs
 * - server-relative paths ("/poster3.png")
 * - TMDb poster_path ("/abcxyz.jpg") which we map to image.tmdb.org original size if present
 */
function absoluteUrl(raw) {
  if (!raw) return null
  if (typeof raw !== 'string') return null
  if (raw.startsWith('http')) return raw
  if (raw.startsWith('//')) return `${location.protocol}${raw}`
  if (raw.startsWith('/')) return `${location.origin}${raw}`
  return raw
}

/**
 * HeroBanner
 * Props:
 *  - movie: object (the hero movie). If null, banner will render nothing (you can pass a HeroStrip as fallback externally).
 *  - onOpen: optional callback when Play/More Info clicked (defaults to dispatching movie:open)
 */
export default function HeroBanner({ movie, onOpen }) {
  if (!movie) return null

  // best available large background: prefer backdrop/backdropUrl, then posterUrl, then poster_path -> TMDb original
  const bgCandidate =
    movie.backdrop ||
    movie.backdropUrl ||
    movie.fanartBackdrop ||
    movie.posterBackdrop ||
    movie.posterUrl ||
    (movie.poster_path ? `https://image.tmdb.org/t/p/original${movie.poster_path}` : null)

  const bg = absoluteUrl(bgCandidate)
  const posterCandidate =
    movie.posterUrl ||
    (movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : movie.fanartPosters?.[0] || null)
  const poster = absoluteUrl(posterCandidate)

  const title = movie.title || movie.name || 'Untitled'
  const desc = movie.overview || movie.description || ''

  function handleOpen() {
    if (typeof onOpen === 'function') {
      onOpen(movie)
    } else {
      window.dispatchEvent(new CustomEvent('movie:open', { detail: { __movie_open__: true, movie } }))
    }
  }

  return (
    <div className="hero-banner" role="region" aria-label={`Featured: ${title}`}>
      {/* background image */}
      <div
        className="hero-banner__bg"
        style={bg ? { backgroundImage: `url("${bg}")` } : {}}
        onClick={handleOpen}
      />

      {/* overlay */}
      <div className="hero-banner__overlay">
        <div className="hero-banner__content" onClick={handleOpen}>
          <h1 className="hero-banner__title">{title}</h1>
          {desc ? <p className="hero-banner__desc">{desc}</p> : null}

          <div className="hero-banner__actions">
            <button className="btn btn-primary" onClick={handleOpen} type="button">Play</button>
            <button className="btn btn-ghost" onClick={handleOpen} type="button">More Info</button>
          </div>
        </div>

        <div className="hero-banner__poster" onClick={handleOpen}>
          <img
            src={poster || '/placeholder.png'}
            alt={`${title} poster`}
            loading="lazy"
            onError={(e) => { e.target.src = '/placeholder.png' }}
          />
        </div>
      </div>
    </div>
  )
}
