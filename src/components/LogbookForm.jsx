import { useState, useEffect } from 'react';
import './LogbookForm.css';
import ChecklistModal from './ChecklistModal';
import NumberPicker from './NumberPicker';

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
    motorHoursStart: '',
    motorHoursEnd: '',
    departureDate: '',
    arrivalDate: '',
    dieselTaken: '',
    motorHoursDieselRefuel: '',
    waterRemaining: '',
    dieselRemaining: '',
    damage: '',
    notes: '',
  });

  const [entryId, setEntryId] = useState(null);
  const [status, setStatus] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [error, setError] = useState(null);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [activePicker, setActivePicker] = useState(null);

  // Load most recent CONCEPT entry on mount
  useEffect(() => {
    const loadRecentConcept = async () => {
      try {
        const response = await fetch('/api/logbook');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          // Find most recent CONCEPT entry (sorted by updated_at DESC)
          const conceptEntry = result.data
            .filter(e => e.status === 'concept')
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

          if (conceptEntry) {
            setEntryId(conceptEntry.id);
            setStatus('concept');
            setLastSaved(new Date(conceptEntry.updated_at));
            setFormData({
              entryDate: conceptEntry.entry_date || new Date().toISOString().split('T')[0],
              skipperId: conceptEntry.skipper_id?.toString() || '',
              motorHoursStart: conceptEntry.motor_hours_start || '',
              motorHoursEnd: conceptEntry.motor_hours_end || '',
              departureDate: conceptEntry.departure_date || '',
              arrivalDate: conceptEntry.arrival_date || '',
              dieselTaken: conceptEntry.diesel_taken || '',
              motorHoursDieselRefuel: conceptEntry.motor_hours_diesel_refuel || '',
              waterRemaining: conceptEntry.water_remaining || '',
              dieselRemaining: conceptEntry.diesel_remaining || '',
              damage: conceptEntry.damage || '',
              notes: conceptEntry.notes || '',
            });
          }
        }
      } catch (err) {
        console.error('Fout bij laden concept entry:', err);
      }
    };

    loadRecentConcept();
  }, []);

  // Auto-fill motorHoursStart from last entry when creating new entry
  useEffect(() => {
    if (entryId || formData.motorHoursStart) return; // Only for new entries without motorHoursStart

    const loadLastMotorHours = async () => {
      try {
        const response = await fetch('/api/logbook');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
          // Find most recent DEFINITIEF entry with motor_hours_end
          const lastEntry = result.data
            .filter(e => e.status === 'definitief' && e.motor_hours_end != null && e.motor_hours_end !== '')
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];

          if (lastEntry && lastEntry.motor_hours_end) {
            setFormData(prev => ({
              ...prev,
              motorHoursStart: parseFloat(lastEntry.motor_hours_end).toString(),
            }));
          }
        }
      } catch (err) {
        console.error('Fout bij laden motor hours:', err);
      }
    };

    // Small delay to ensure form is ready on mobile
    setTimeout(loadLastMotorHours, 100);
  }, []);

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
    // Validate required fields
    if (!formData.skipperId) {
      setError('Kies een schipper voordat je opslaat');
      return;
    }
    if (!formData.departureDate) {
      setError('Vul een vertrekdag in');
      return;
    }
    if (!formData.arrivalDate) {
      setError('Vul een aankomstdag in');
      return;
    }

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
        // Better error messages
        if (result.error?.includes('foreign key')) {
          setError('Fout: Controleer of je een geldige schipper hebt geselecteerd');
        } else if (result.error?.includes('UNIQUE')) {
          setError('Dit logboek bestaat al');
        } else {
          setError(result.error || 'Fout bij opslaan');
        }
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

  const handleMakeDefinitive = async () => {
    if (!entryId) {
      setError('Sla eerst op voordat je definiteef maakt');
      return;
    }

    // Bevestigings-dialog
    const confirmed = window.confirm(
      'Weet je zeker dat je dit logboek wil inleveren?\n\nJe kunt het daarna niet meer wijzigen.'
    );

    if (!confirmed) return;

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
      } else {
        setError(result.error || 'Fout bij inleveren');
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

  const handleDeleteConcept = async () => {
    if (!entryId) return;

    const confirmed = window.confirm(
      'Dit concept verwijderen? Dit kan niet ongedaan gemaakt worden.'
    );

    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/logbook/${entryId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        resetForm();
      } else {
        setError(result.error || 'Fout bij verwijderen');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Kan niet verbinden met server');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      entryDate: new Date().toISOString().split('T')[0],
      skipperId: '',
      motorHoursStart: '',
      motorHoursEnd: '',
      departureDate: '',
      arrivalDate: '',
      dieselTaken: '',
      motorHoursDieselRefuel: '',
      waterRemaining: '',
      dieselRemaining: '',
      damage: '',
      notes: '',
    });
    setEntryId(null);
    setStatus(null);
    setLastSaved(null);
    setError(null);
  };

  return (
    <div className="logbook-form">
      {/* Status indicator bar - only show after first save */}
      {status && (
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
      )}

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
            <label htmlFor="departureDate">Vertrekdag *</label>
            <div className="date-input-wrapper" onClick={() => document.getElementById('departureDate')?.showPicker()}>
              <span className="calendar-icon">📅</span>
              <input
                id="departureDate"
                name="departureDate"
                type="date"
                value={formData.departureDate}
                onChange={handleChange}
                disabled={status === 'definitief'}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="arrivalDate">Aankomstdag *</label>
            <div className="date-input-wrapper" onClick={() => document.getElementById('arrivalDate')?.showPicker()}>
              <span className="calendar-icon">📅</span>
              <input
                id="arrivalDate"
                name="arrivalDate"
                type="date"
                value={formData.arrivalDate}
                onChange={handleChange}
                disabled={status === 'definitief'}
                required
              />
            </div>
          </div>

          {formData.departureDate && formData.arrivalDate && (
            <div className="form-group">
              <label>Gezeilde dagen</label>
              <div style={{
                padding: '10px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}>
                {Math.max(0, Math.ceil((new Date(formData.arrivalDate) - new Date(formData.departureDate)) / (1000 * 60 * 60 * 24)) + 1)} dag(en)
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="motorHoursStart">Motoruren bij vertrek</label>
            <div
              id="motorHoursStart"
              onClick={() => setActivePicker('motorHoursStart')}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: status === 'definitief' ? 'not-allowed' : 'pointer',
                backgroundColor: status === 'definitief' ? '#f5f5f5' : 'white',
                opacity: status === 'definitief' ? 0.6 : 1,
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {formData.motorHoursStart || '—'}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="motorHoursEnd">Motoruren bij aankomst</label>
            <div
              id="motorHoursEnd"
              onClick={() => setActivePicker('motorHoursEnd')}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: status === 'definitief' ? 'not-allowed' : 'pointer',
                backgroundColor: status === 'definitief' ? '#f5f5f5' : 'white',
                opacity: status === 'definitief' ? 0.6 : 1,
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {formData.motorHoursEnd || '—'}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dieselTaken">Diesel getankt (L)</label>
            <div
              id="dieselTaken"
              onClick={() => setActivePicker('dieselTaken')}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: status === 'definitief' ? 'not-allowed' : 'pointer',
                backgroundColor: status === 'definitief' ? '#f5f5f5' : 'white',
                opacity: status === 'definitief' ? 0.6 : 1,
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {formData.dieselTaken || '—'}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="motorHoursDieselRefuel">Motoruren na tanken</label>
            <div
              id="motorHoursDieselRefuel"
              onClick={() => setActivePicker('motorHoursDieselRefuel')}
              style={{
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                cursor: status === 'definitief' ? 'not-allowed' : 'pointer',
                backgroundColor: status === 'definitief' ? '#f5f5f5' : 'white',
                opacity: status === 'definitief' ? 0.6 : 1,
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {formData.motorHoursDieselRefuel || '—'}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="waterRemaining">Water bij vertrek van boord</label>
            <select
              id="waterRemaining"
              name="waterRemaining"
              value={formData.waterRemaining}
              onChange={handleChange}
              disabled={status === 'definitief'}
            >
              <option value="">— Kies percentage —</option>
              <option value="20">20%</option>
              <option value="40">40%</option>
              <option value="60">60%</option>
              <option value="80">80%</option>
              <option value="100">100%</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="dieselRemaining">Diesel bij vertrek van boord</label>
            <select
              id="dieselRemaining"
              name="dieselRemaining"
              value={formData.dieselRemaining}
              onChange={handleChange}
              disabled={status === 'definitief'}
            >
              <option value="">— Kies percentage —</option>
              <option value="20">20%</option>
              <option value="40">40%</option>
              <option value="60">60%</option>
              <option value="80">80%</option>
              <option value="100">100%</option>
            </select>
          </div>

<div className="form-group full-width">
            <label htmlFor="damage">Meldingen schade/onderhoud</label>
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
          {(!status || status === 'concept') && (
            <>
              {entryId && status === 'concept' && (
                <button
                  type="button"
                  className="submit-button"
                  style={{ backgroundColor: '#d32f2f' }}
                  onClick={handleDeleteConcept}
                  disabled={saving}
                  title="Verwijder dit concept"
                >
                  🗑️ Verwijderen
                </button>
              )}
              <button
                type="button"
                className="submit-button"
                style={{ backgroundColor: '#34a853' }}
                onClick={handleMakeDefinitive}
                disabled={!entryId || saving}
              >
                {saving ? '⏳ Inleveren...' : '✅ Definitief opslaan'}
              </button>
              <button
                type="button"
                className="submit-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '⏳ Opslaan...' : '💾 Concept opslaan'}
              </button>
            </>
          )}
          {status === 'definitief' && (
            <button
              type="button"
              className="submit-button"
              style={{ backgroundColor: '#34a853' }}
              onClick={() => setChecklistModalOpen(true)}
            >
              ✅ Checklist invullen
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

      {activePicker && (
        <NumberPicker
          value={formData[activePicker]}
          onChange={(val) => {
            setFormData(prev => ({
              ...prev,
              [activePicker]: val,
            }));
          }}
          onClose={() => setActivePicker(null)}
          label={
            activePicker === 'motorHoursStart' ? 'Motoruren bij vertrek' :
            activePicker === 'motorHoursEnd' ? 'Motoruren bij aankomst' :
            activePicker === 'motorHoursDieselRefuel' ? 'Motoruren na tanken' :
            activePicker === 'dieselTaken' ? 'Diesel getankt (L)' :
            'Getal invoeren'
          }
        />
      )}

      <ChecklistModal
        isOpen={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        onSave={handleChecklistSave}
      />
    </div>
  );
}

export default LogbookForm;
