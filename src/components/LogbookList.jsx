import { useState } from 'react';
import './LogbookList.css';

function LogbookList({ entries }) {
  const [expandedId, setExpandedId] = useState(null);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const calculateSailingDays = (departure, arrival) => {
    if (!departure || !arrival) return '—';
    const start = new Date(departure);
    const end = new Date(arrival);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days > 0 ? `${days}` : '—';
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="logbook-list">
      <div className="entries-container">
        {entries.map(entry => (
          <div key={entry.id} className="entry-card">
            <div className="entry-header" onClick={() => toggleExpand(entry.id)}>
              <div className="entry-main">
                <div className="entry-skipper">{entry.skipper_name || '—'}</div>
                <div className="entry-dates">
                  {formatDate(entry.departure_date)} → {formatDate(entry.arrival_date)}
                </div>
                <div className="entry-motor">
                  Motor: {entry.motor_hours_start || '—'} → {entry.motor_hours_end || '—'}h
                </div>
                <div className="entry-days">
                  {calculateSailingDays(entry.departure_date, entry.arrival_date)} dag(en)
                </div>
              </div>
              <div className="expand-icon">{expandedId === entry.id ? '▼' : '▶'}</div>
            </div>

            {expandedId === entry.id && (
              <div className="entry-details">
                {entry.notes && (
                  <div className="detail-section full-width">
                    <strong>Opmerkingen:</strong>
                    <p>{entry.notes}</p>
                  </div>
                )}
                <div className="detail-row">
                  {entry.diesel_taken && (
                    <div className="detail-section">
                      <strong>Diesel getankt:</strong> {entry.diesel_taken}L
                      {entry.motor_hours_diesel_refuel && ` bij ${entry.motor_hours_diesel_refuel}h`}
                    </div>
                  )}
                  {entry.water_remaining && (
                    <div className="detail-section">
                      <strong>Water bij vertrek:</strong> {entry.water_remaining}%
                    </div>
                  )}
                  {entry.diesel_remaining && (
                    <div className="detail-section">
                      <strong>Diesel bij vertrek:</strong> {entry.diesel_remaining}%
                    </div>
                  )}
                </div>
                {entry.damage && (
                  <div className="detail-section damage full-width">
                    <strong>⚠️ Schade:</strong>
                    <p>{entry.damage}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {entries.length > 0 && (
        <div className="summary">
          <p>Totaal tochten: <strong>{entries.length}</strong></p>
        </div>
      )}
    </div>
  );
}

export default LogbookList;
