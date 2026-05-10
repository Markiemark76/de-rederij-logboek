import { useState, useEffect } from 'react';
import './ChecklistModal.css';

const CHECKLIST_SECTIONS = [
  {
    id: 'outside',
    title: 'Buitenwerk',
    items: [
      { id: 'deck-scrub', label: 'Dek en spiegel schrobben', help: 'Maak het dek en de spiegel schoon zodat zout, vuil en aanslag niet blijven zitten.' },
      { id: 'fill-water', label: 'Watertanks vullen', help: 'Vul de watertanks weer af voor de volgende bemanning.' },
      { id: 'cockpit-table', label: 'Kuiptafel schoonmaken', help: 'Neem de kuiptafel af en laat hem netjes achter.' },
      { id: 'swim-ladder', label: 'Zwemtrap controleren', help: 'Controleer of de zwemtrap goed vastzit en netjes is opgeborgen.' },
      { id: 'exhaust-soot', label: 'Roet bij uitlaat weghalen', help: 'Veeg roet of aanslag rondom de uitlaat weg.' },
      { id: 'shower-tap', label: 'Buitendouche afsluiten', help: 'Controleer of de douchekraan op de spiegel dicht staat.' },
      { id: 'gas-bottle', label: 'Gaskraan buiten dicht', help: 'Draai de kraan van de gasfles buiten dicht.' },
      { id: 'flags-ring', label: 'Vlag en gele ring opruimen', help: 'Berg de vlag en de gele ring netjes op.' },
      { id: 'instrument-caps', label: 'Instrumentkappen plaatsen', help: 'Plaats de beschermkappen terug op de instrumenten.' },
      { id: 'midspring', label: 'Midspring goed beleggen', help: 'Leg de midspring netjes vast voor het afmeren.' },
      { id: 'furling-jib', label: 'Rolfok goed weggebonden', help: 'Controleer of de fok goed ingerold en gezekerd is.' },
      { id: 'halyards', label: 'Vallen vrij van de mast', help: 'Bind de vallen zo weg dat ze niet tegen de mast slaan.' },
      { id: 'boat-hook', label: 'Bootshaak en dekzwabber binnen', help: 'Leg bootshaak en dekzwabber weer binnenboord.' },
      { id: 'shore-power', label: 'Walstroomkabel uitleggen', help: 'Leg de walstroomkabel klaar en sluit hem correct aan als dat nodig is.' },
      { id: 'locker-locks', label: 'Kistjes op slot', help: 'Controleer of de buitenkisten weer op slot zitten.' },
    ],
  },
  {
    id: 'inside',
    title: 'Werkzaamheden binnen',
    items: [
      { id: 'engine-oil', label: 'Motorolie controleren', help: 'Check het oliepeil van de motor.' },
      { id: 'saildrive-oil', label: 'Saildrive-olie controleren', help: 'Controleer het peil van de saildrive-olie.' },
      { id: 'bilge', label: 'Bilge inspecteren', help: 'Controleer of er geen bijzonderheden of overtollig water in de bilge staan.' },
      { id: 'interior-clean', label: 'Interieur schoon achterlaten', help: 'Stofzuig of dweil waar nodig en laat het schip netjes achter.' },
      { id: 'galley-clean', label: 'Kombuis, oven en koelkast schoon', help: 'Maak kooktoestel, oven en koelkast schoon.' },
      { id: 'fridge-open', label: 'Koelkast op een kier', help: 'Laat de koelkastdeur open zodat er geen schimmel ontstaat.' },
      { id: 'inside-gas', label: 'Gaskraan binnen dicht', help: 'Sluit de gaskraan in het schip.' },
      { id: 'hydrophore', label: 'Druk van hydrofoor halen', help: 'Haal de druk van de hydrofoor na gebruik.' },
      { id: 'seacocks', label: 'Afsluiters dicht', help: 'Controleer of alle afsluiters dicht staan.' },
      { id: 'food', label: 'Bederfelijk eten meenemen', help: 'Laat geen bederfelijk voedsel aan boord achter.' },
      { id: 'trash', label: 'Afval legen en nieuwe zak', help: 'Leeg de prullenbak en plaats een nieuwe zak.' },
      { id: 'diesel-supply', label: 'Dieseltoevoer open laten', help: 'Let op: de dieselafsluiter moet juist open blijven.' },
      { id: 'logbook-updated', label: 'Logboek bijgewerkt', help: 'Controleer of het logboek helemaal is ingevuld.' },
      { id: 'hatches-lock', label: 'Luiken dicht en op slot', help: 'Sluit alle luiken goed af.' },
      { id: 'boiler-off', label: 'Boiler uit', help: 'Zet de boiler uit.' },
      { id: 'switches-off', label: 'Hoofdschakelaar en boegschroef uit', help: 'Zet hoofdschakelaar, ankerlier en boegschroefschakelaar uit.' },
      { id: 'cabin-hatch', label: 'Kajuitingang dicht', help: 'Sluit de kajuit ingang netjes af.' },
    ],
  },
];

function ChecklistModal({ isOpen, onClose, onSave }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [notes, setNotes] = useState('');
  const [expandedHelp, setExpandedHelp] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Initialize all items as null (not set)
      const initial = {};
      CHECKLIST_SECTIONS.forEach(section => {
        section.items.forEach(item => {
          initial[item.id] = null;
        });
      });
      setCheckedItems(initial);
      setNotes('');
      setExpandedHelp({});
    }
  }, [isOpen]);

  const setItemStatus = (itemId, status) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: status,
    }));
  };

  const toggleHelpText = (itemId) => {
    setExpandedHelp(prev => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const totalItems = CHECKLIST_SECTIONS.reduce((sum, section) => sum + section.items.length, 0);
  const doneCount = Object.values(checkedItems).filter(v => v === 'done').length;
  const progressPercent = totalItems > 0 ? (doneCount / totalItems) * 100 : 0;

  const handleSave = () => {
    onSave({
      checkedItems,
      notes,
      progressPercent,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="checklist-backdrop" onClick={onClose}>
      <div className="checklist-modal" onClick={e => e.stopPropagation()}>
        <div className="checklist-header">
          <div>
            <h2>Boot afsluiten en netjes achterlaten</h2>
            <p>Werk de checklist af en sluit hem dan af.</p>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="checklist-progress">
          <div className="progress-info">
            <strong>{doneCount} van {totalItems} taken gedaan</strong>
            <span className="progress-percent">{Math.round(progressPercent)}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
        </div>

        <div className="checklist-sections">
          {CHECKLIST_SECTIONS.map(section => (
            <div key={section.id} className="checklist-section">
              <h3>{section.title}</h3>
              <div className="checklist-items">
                {section.items.map(item => (
                  <div key={item.id} className="checklist-item">
                    <div className="item-header">
                      <div className="item-label-wrapper">
                        <span className="item-label">{item.label}</span>
                        <button
                          className="help-toggle"
                          onClick={() => toggleHelpText(item.id)}
                          title="Meer informatie"
                        >
                          ⓘ
                        </button>
                      </div>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={checkedItems[item.id] === 'done'}
                          onChange={(e) => setItemStatus(item.id, e.target.checked ? 'done' : 'not-done')}
                        />
                        <span className="slider"></span>
                      </label>
                    </div>
                    {expandedHelp[item.id] && (
                      <div className="item-help-expanded">{item.help}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="checklist-notes">
          <label htmlFor="checklist-notes">Opmerking voor de volgende schipper</label>
          <textarea
            id="checklist-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Alleen invullen als er iets is dat de volgende schipper moet weten."
            rows="3"
          />
        </div>

        <div className="checklist-actions">
          <button className="btn-primary" onClick={handleSave}>
            ✓ Opslaan en sluiten
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Annuleren
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChecklistModal;
