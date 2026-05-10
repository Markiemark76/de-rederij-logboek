import './LogbookList.css';

function LogbookList({ entries }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    return timeStr;
  };

  return (
    <div className="logbook-list">
      <div className="table-wrapper">
        <table className="logbook-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Schipper</th>
              <th>Vertrek</th>
              <th>Aankomst</th>
              <th>Wind</th>
              <th>Motor (uren)</th>
              <th>Opmerking</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id} className="entry-row">
                <td className="date">{formatDate(entry.entry_date)}</td>
                <td className="skipper">{entry.skipper_name || '—'}</td>
                <td className="port">{entry.departure_port || '—'}</td>
                <td className="port">{entry.arrival_port || '—'}</td>
                <td className="wind">{entry.wind_force || '—'} Bft</td>
                <td className="motor">
                  {entry.motor_hours_start && entry.motor_hours_end
                    ? `${entry.motor_hours_start} → ${entry.motor_hours_end}`
                    : '—'
                  }
                </td>
                <td className="notes">
                  {entry.notes ? entry.notes.substring(0, 30) + '...' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
