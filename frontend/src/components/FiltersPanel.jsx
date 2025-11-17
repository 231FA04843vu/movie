// frontend/src/components/FiltersPanel.jsx
import React from 'react'

const GENRES = ['Action','Comedy','Drama','Sci-Fi','Romance','Thriller']

export default function FiltersPanel({ filters, setFilters }) {
  function toggleGenre(g) {
    setFilters(f => {
      const existing = Array.isArray(f.genres) ? f.genres : []
      const exists = existing.includes(g)
      return { ...f, genres: exists ? existing.filter(x => x !== g) : [...existing, g] }
    })
  }

  return (
    <div className="filters" style={{ display:'flex', gap:12, alignItems: 'center', padding: '12px 0' }}>
      {GENRES.map(g => (
        <button
          key={g}
          className={`chip ${ (filters.genres||[]).includes(g) ? 'chip-active' : '' }`}
          onClick={() => toggleGenre(g)}
        >
          {g}
        </button>
      ))}

      <label style={{ marginLeft: 'auto', color: '#ccc', fontWeight: 600 }}>
        Min rating:
        <input
          style={{ marginLeft: 10 }}
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={filters.minRating || 0}
          onChange={e => setFilters(f => ({ ...f, minRating: Number(e.target.value) }))}
        />
      </label>
    </div>
  )
}
