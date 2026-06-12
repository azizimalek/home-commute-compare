import { useState } from 'react'
import type { CommuteResult, LocationPoint, RankBy } from '../types'

interface ComparisonPanelProps {
  results: CommuteResult[]
  homes: LocationPoint[]
  work: LocationPoint | null
  rankBy: RankBy
  showReturnTrip: boolean
  loading: boolean
  error: string | null
  onRemoveHome: (id: string) => void
  onRenameHome: (id: string, label: string) => void
  onCompare: () => void
  canCompare: boolean
}

function resultsSubheading(rankBy: RankBy): string {
  return rankBy === 'DISTANCE'
    ? 'Sorted by shortest distance'
    : 'Sorted by shortest travel time'
}

function HomeNameEditor({
  home,
  onRename,
}: {
  home: LocationPoint
  onRename: (id: string, label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(home.label)

  const commit = () => {
    const trimmed = draft.trim()
    if (trimmed) onRename(home.id, trimmed)
    else setDraft(home.label)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        className="location-item__name-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft(home.label)
            setEditing(false)
          }
        }}
        autoFocus
      />
    )
  }

  return (
    <button
      type="button"
      className="location-item__name"
      onClick={() => {
        setDraft(home.label)
        setEditing(true)
      }}
      title="Click to rename"
    >
      {home.label}
    </button>
  )
}

export function ComparisonPanel({
  results,
  homes,
  work,
  rankBy,
  showReturnTrip,
  loading,
  error,
  onRemoveHome,
  onRenameHome,
  onCompare,
  canCompare,
}: ComparisonPanelProps) {
  const bestId = results.find((r) => r.status === 'OK')?.homeId
  const hasReturn = showReturnTrip && results.some((r) => r.returnStatus)

  return (
    <div className="panel">
      <section className="panel__section">
        <h2 className="panel__heading">Locations</h2>
        <div className="location-list">
          <div className="location-item location-item--work">
            <span className="location-item__badge">Work</span>
            <div className="location-item__body">
              {work ? (
                <>
                  <strong>{work.label}</strong>
                  <span className="location-item__address">{work.address}</span>
                </>
              ) : (
                <span className="location-item__placeholder">
                  Search or click the map in Select + Work mode
                </span>
              )}
            </div>
          </div>

          {homes.length === 0 ? (
            <p className="panel__hint">
              No home candidates yet. Search or click the map in Select + Home mode.
            </p>
          ) : (
            homes.map((home) => (
              <div key={home.id} className="location-item location-item--home">
                <div className="location-item__body">
                  <HomeNameEditor home={home} onRename={onRenameHome} />
                  <span className="location-item__address">{home.address}</span>
                </div>
                <button
                  type="button"
                  className="location-item__remove"
                  onClick={() => onRemoveHome(home.id)}
                  aria-label={`Remove ${home.label}`}
                >
                  ×
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="panel__section">
        <button
          type="button"
          className="btn btn--primary"
          onClick={onCompare}
          disabled={!canCompare || loading}
        >
          {loading ? 'Calculating…' : 'Compare commute times'}
        </button>
        {error && <p className="panel__error">{error}</p>}
      </section>

      {results.length > 0 && (
        <section className="panel__section">
          <h2 className="panel__heading">Results</h2>
          <p className="panel__subheading">{resultsSubheading(rankBy)}</p>
          <div className={`results-table ${hasReturn ? 'results-table--with-return' : ''}`}>
            <div className="results-table__header">
              <span>Home</span>
              <span>To work</span>
              {hasReturn && <span>Return</span>}
              <span>Distance</span>
            </div>
            {results.map((result, index) => (
              <div
                key={result.homeId}
                className={`results-row ${result.homeId === bestId ? 'results-row--best' : ''} ${hasReturn ? 'results-row--with-return' : ''}`}
              >
                <span className="results-row__rank">{index + 1}</span>
                <span className="results-row__label">{result.homeLabel}</span>
                <span className="results-row__time">
                  {result.status === 'OK' ? result.durationText : result.errorMessage}
                </span>
                {hasReturn && (
                  <span className="results-row__time results-row__time--return">
                    {result.returnStatus === 'OK'
                      ? result.returnDurationText
                      : result.returnStatus === 'ERROR'
                        ? result.returnErrorMessage
                        : '—'}
                  </span>
                )}
                <span className="results-row__distance">
                  {result.status === 'OK' ? result.distanceText : '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
