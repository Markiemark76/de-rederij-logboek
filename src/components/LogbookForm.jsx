import { useState, useEffect } from 'react';
import './LogbookForm.css';
import ChecklistModal from './ChecklistModal';

const PORTS = [
  'Colijnsplaat',
  'Bruinisse',
  'Hansweert',
  'Hardinxveld-Giessendam',
  'Kats',
  'Kortgene',
  'Oost-Souburg',
  'Scheveningen',
  'Sint Philipsland',
  'Tholen',
  'Veere',
  'Vlissingen',
  'Wemeldinge',
  'Yerseke',
  'Zierikzee',
];

function LogbookForm({ members, onEntryAdded }) {
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    skipperId: '',
    crewMembers: '',
    windForce: '3',
    motorHoursStart: '',
    motorHoursEnd: '',
    departurePort: '',
    arrivalPort: '',
    dieselTaken: '',
    waterRemaining: '',
    dieselRemaining: '',
    damage: '',
    notes: '',
  });

  const [entryId, setEntryId] = useState(null);
  const [status, setStatus] = useState('concept');
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [error, setError] = useState(null);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);

  // Auto-save interval effect
  useEffect(() => {
    if (status !== 'concept' || !entryId) return;

    const interval = setInterval(async () => {
      setAutoSaving(true);
      try {
        const response = await fetch(`/api/logbook/${entryId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            status: 'concept',
          }),
        });

        const result = await response.json();
        if (result.success) {
          setLastSaved(new Date());
          setError(null);
        } else {
          setError('Auto-save mislukt');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setError('Verbindingsfout bij auto-save');
      } finally {
        setAutoSaving(false);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [status, entryId, formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNewEntry = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'concept',
          createdBy: 1,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEntryId(result.data.id);
        setStatus('concept');
        setLastSaved(new Date());
      } else {
        setError(result.error || 'Fout bij opslaan');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Kan niet verbinden met server');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!entryId) {
      await handleNewEntry();
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/logbook/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'concept',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLastSaved(new Date());
      } else {
        setError(result.error || 'Fout bij opslaan');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Kan niet verbinden met server');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalize = async () => {
    if (!entryId) {
      setError('Sla eerst op voordat je afrondt');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/logbook/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'definitief',
        }),
      });

      const result = await response.json();
      if (result.success) {
        setStatus('definitief');
        setChecklistModalOpen(true);
      } else {
        setError(result.error || 'Fout bij afronden');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Kan niet verbinden met server');
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistSave = () => {
    // Reset for new entry
    resetForm();
    setChecklistModalOpen(false);
    onEntryAdded();
  };

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split('T')[0],
      skipperId: '',
      crewMembers: '',
      windForce: '3',
      motorHoursStart: '',
      motorHoursEnd: '',
      departurePort: '',
      arrivalPort: '',
      dieselTaken: '',
      waterRemaining: '',
      dieselRemaining: '',
      damage: '',
      notes: '',
    });
    setEntryId(null);
    setStatus('concept');
    setLastSaved(null);
    setError(null);
  };

  return (
    <div className="logbook-form">
      {/* Status indicator bar */}
      <div style={{
        backgroundColor: status === 'concept' ? '#e3f2fd' : '#e8f5e9',
        borderLeft: `4px solid ${status === 'concept' ? '#2196f3' : '#4caf50'}`,
        padding: '12px',
        marginBottom: '16px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <strong>{status === 'concept' ? '✏️ CONCEPT' : '✅ DEFINITIEF'}</strong>
          {status === 'concept' && autoSaving && ' (Auto-save bezig...)'}
          {status === 'concept' && !autoSaving && lastSaved && (
            <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
              Laatst opgeslagen: {lastSaved.toLocaleTimeString('nl-NL')}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: '#ffebee',
          borderLeft: '4px solid #f44336',
          color: '#f44336',
          padding: '12px',
          marginBottom: '16px',
          borderRadius: '4px',
        }}>
          {error}
        </div>
      )}

      <form className="logbook-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="entryDate">Datum *</label>
            <input
              id="entryDate"
              name="entryDate"
              type="date"
              value={formData.entryDate}
              onChange={handleChange}
              disabled={status === 'definitief'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="skipperId">Schipper *</label>
            <select
              id="skipperId"
              name="skipperId"
              value={formData.skipperId}
              onChange={handleChange}
              disabled={status === 'definitief'}
              required
            >
              <option value="">Kies schipper...</option>
              {members.map(member => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="windForce">Windkracht *</label>
            <select
              id="windForce"
              name="windForce"
              value={formData.windForce}
              onChange={handleChange}
              disabled={status === 'definitief'}
              required
            >
              <option value="0">0 Bft - Windstil</option>
              <option value="1">1 Bft - Zeer zwak</option>
              <option value="2">2 Bft - Zwak</option>
              <option value="3">3 Bft - Zwak</option>
              <option value="4">4 Bft - Matig</option>
              <option value="5">5 Bft - Matig</option>
              <option value="6">6 Bft - Vrij krachtig</option>
              <option value="7">7 Bft - Krachtig</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="departurePort">Vertrekhaven *</label>
            <input
              id="departurePort"
              name="departurePort"
              type="text"
              value={formData.departurePort}
              onChange={handleChange}
              placeholder="bijv. Colijnsplaat"
              disabled={status === 'definitief'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="arrivalPort">Aankomsthaven *</label>
            <input
              id="arrivalPort"
              name="arrivalPort"
              type="text"
              value={formData.arrivalPort}
              onChange={handleChange}
              placeholder="bijv. Zierikzee"
              disabled={status === 'definitief'}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="motorHoursStart">Motoruren start</label>
            <input
              id="motorHoursStart"
              name="motorHoursStart"
              type="number"
              step="0.1"
              value={formData.motorHoursStart}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="motorHoursEnd">Motoruren eind</label>
            <input
              id="motorHoursEnd"
              name="motorHoursEnd"
              type="number"
              step="0.1"
              value={formData.motorHoursEnd}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dieselTaken">Diesel genomen (L)</label>
            <input
              id="dieselTaken"
              name="dieselTaken"
              type="number"
              step="1"
              value={formData.dieselTaken}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="waterRemaining">Water voorraad eind (%)</label>
            <input
              id="waterRemaining"
              name="waterRemaining"
              type="number"
              min="0"
              max="100"
              value={formData.waterRemaining}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dieselRemaining">Diesel voorraad eind (%)</label>
            <input
              id="dieselRemaining"
              name="dieselRemaining"
              type="text"
              placeholder="bijv. 75%"
              value={formData.dieselRemaining}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="crewMembers">Bemanningsleden</label>
            <input
              id="crewMembers"
              name="crewMembers"
              type="text"
              placeholder="Namen gescheiden door komma"
              value={formData.crewMembers}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="damage">Schade</label>
            <textarea
              id="damage"
              name="damage"
              rows="2"
              placeholder="Beschrijf eventuele schade..."
              value={formData.damage}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="notes">Opmerkingen</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              placeholder="Bijzonderheden van de tocht..."
              value={formData.notes}
              onChange={handleChange}
              disabled={status === 'definitief'}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {status === 'concept' && (
            <>
              <button
                type="button"
                className="submit-button"
                style={{ backgroundColor: '#34a853' }}
                onClick={handleFinalize}
                disabled={!entryId || saving}
              >
                {saving ? 'Afronden...' : '✅ Afronden & Checklist'}
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleSave}
                disabled={saving || autoSaving}
              >
                {saving || autoSaving ? 'Opslaan...' : '💾 Nu opslaan'}
              </button>
            </>
          )}
          {status === 'definitief' && (
            <button
              type="button"
              className="submit-button"
              style={{ backgroundColor: '#999', cursor: 'not-allowed' }}
              disabled
            >
              ✅ Afgerond
            </button>
          )}
        </div>

        {!entryId && (
          <div style={{
            marginTop: '1rem',
            padding: '12px',
            backgroundColor: '#fff3cd',
            borderLeft: '4px solid #ffc107',
            borderRadius: '4px',
          }}>
            Klik "💾 Nu opslaan" om dit logboek op te slaan en auto-save in te schakelen.
          </div>
        )}
      </form>

      <ChecklistModal
        isOpen={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        onSave={handleChecklistSave}
      />
    </div>
  );
}

export default LogbookForm;
