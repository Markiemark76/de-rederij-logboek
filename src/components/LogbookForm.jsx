import { useState } from 'react';
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

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [checklistData, setChecklistData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChecklistSave = (data) => {
    setChecklistData(data);
    setChecklistModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const response = await fetch('/api/logbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          createdBy: 1,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setSuccess(true);
        // Reset form
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
        setTimeout(() => setSuccess(false), 3000);
        onEntryAdded();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="logbook-form" onSubmit={handleSubmit}>
      {success && <div className="success-message">✓ Tocht opgeslagen!</div>}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="entryDate">Datum *</label>
          <input
            id="entryDate"
            name="entryDate"
            type="date"
            value={formData.entryDate}
            onChange={handleChange}
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
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="submit-button"
          style={{ backgroundColor: '#34a853' }}
          onClick={() => setChecklistModalOpen(true)}
        >
          ✓ Checklist
        </button>
        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Opslaan...' : '💾 Opslaan'}
        </button>
      </div>

      {checklistData && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#e6f4ea', borderRadius: '4px', borderLeft: '3px solid #34a853' }}>
          <strong>✓ Checklist afgerond: {checklistData.progressPercent}% voltooid</strong>
        </div>
      )}

      <ChecklistModal
        isOpen={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        onSave={handleChecklistSave}
      />
    </form>
  );
}

export default LogbookForm;
