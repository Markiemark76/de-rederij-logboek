import { useState } from 'react';
import '../pages/InfoPage.css';

const INFO_SECTIONS = [
  { id: 'toiletcode', label: '🔐 Toiletcode', title: 'Toiletcode' },
  { id: 'haven', label: '☎️ Haven afmelden', title: 'Haven afmelden' },
  { id: 'documenten', label: '📄 Documenten', title: 'Documenten' },
  { id: 'veiligheid', label: '⚠️ Veiligheid', title: 'Veiligheid' },
  { id: 'schip', label: '🚤 Schip', title: 'Schip' },
  { id: 'ligplaats', label: '📍 Ligplaats', title: 'Ligplaats' },
  { id: 'kleding', label: '👕 Zeilkleding', title: 'Zeilkleding' },
  { id: 'afspraken', label: '📋 Afspraken', title: 'Afspraken' },
  { id: 'noodnummers', label: '🚨 Noodnummers', title: 'Noodnummers' },
];

const INFO_CONTENT = {
  toiletcode: {
    title: 'Toiletcode',
    subtitle: 'Sanitair Colijnsplaat',
    content: (
      <div className="info-content">
        <div className="info-highlight">
          <span className="info-label">Toegangscode sanitair Colijnsplaat 2026</span>
          <strong className="info-code">147369#</strong>
        </div>
      </div>
    ),
  },
  haven: {
    title: 'Haven afmelden',
    subtitle: 'De website werkt nu niet goed, dus meld eerst telefonisch af bij de club.',
    content: (
      <div className="info-content">
        <p>Bel eerst met de havenvereniging voordat je vertrekt uit de haven.</p>
        <div className="info-highlight">
          <span className="info-label">Telefoonnummer club</span>
          <strong>+31 113 695 762</strong>
        </div>
        <div className="button-row">
          <a className="button secondary" href="tel:+31113695762">
            Bel de club
          </a>
          <a
            className="button secondary"
            href="https://mijn.wsvnb.nl/#/customer/auth/login"
            target="_blank"
            rel="noopener noreferrer"
          >
            Website openen
          </a>
        </div>
      </div>
    ),
  },
  documenten: {
    title: 'Documenten',
    subtitle: 'Officiele stukken van de vereniging',
    content: (
      <div className="info-content">
        <div className="button-row">
          <a
            className="button secondary"
            href="/Statuten%20en%20reglement%20DeRederij-dec2021.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            📥 Statuten & reglement
          </a>
        </div>
      </div>
    ),
  },
  veiligheid: {
    title: 'Veiligheid',
    subtitle: 'Belangrijk voor varen onder verschillende omstandigheden',
    content: (
      <div className="info-content">
        <p>
          De Parmyra is onder moderne omstandigheden goed hanteerbaar, maar boven windkracht
          zeven wordt in principe niet uitgevaren.
        </p>
        <p>
          Op open water en bij windkracht boven 6 Beaufort zijn zwemvesten of lifelines aan dek
          verplicht.
        </p>
      </div>
    ),
  },
  schip: {
    title: 'Schip',
    subtitle: 'Vaste basisinformatie',
    content: (
      <div className="info-content">
        <p>
          De Parmyra is een Bavaria 38 uit 2003, ontworpen door J&J Design en gebouwd bij Bavaria
          in Duitsland.
        </p>
        <p>Lengte 12,10 meter, breedte 3,80 meter, stahoogte 1,95 meter en beladen gewicht 7.000 kilo.</p>
        <p>Volvo Turbo Saildrive 21,5 kW, brandstoftank 60 liter, drinkwater 300 liter en vuilwatertank 60 liter.</p>
      </div>
    ),
  },
  ligplaats: {
    title: 'Ligplaats',
    subtitle: 'Waar de Parmyra ligt in Colijnsplaat',
    content: (
      <div className="info-content">
        <p>
          De vaste thuishaven is jachthaven Colijnsplaat aan de Oosterschelde, direct aan de
          Zeelandbrug.
        </p>
        <p>Het schip ligt in box C8 in het oostelijke deel van de haven.</p>
        <p>
          Vanaf Colijnsplaat: bij de haven rechtsaf, parkeren bij de voormalige visafslag,
          dichtstbijzijnde steiger oplopen, eerste links en derde rechts.
        </p>
      </div>
    ),
  },
  kleding: {
    title: 'Zeilkleding',
    subtitle: 'Wat handig of verplicht is aan boord',
    content: (
      <div className="info-content">
        <p>
          Aan boord zijn self-inflating zwemvesten voor vier bemanningsleden en twee XL-zeilpakken
          voor gasten.
        </p>
        <p>In koude maanden zijn handschoenen, warm jack, muts en goede laarzen echt nodig.</p>
        <p>Aan boord zijn zeilschoenen, zeillaarzen of niet-afgevende sportschoenen verplicht.</p>
      </div>
    ),
  },
  afspraken: {
    title: 'Afspraken',
    subtitle: 'Belangrijke werkwijze binnen de groep',
    content: (
      <div className="info-content">
        <p>Meld bijzonderheden direct in het logboek en stem onderhoud altijd af met de groep.</p>
        <p>Tijdens de vaart is het schip doorgaans bereikbaar via GSM 06-53490721.</p>
        <p>
          Meer algemene informatie staat ook op{' '}
          <a href="https://www.parmyra.nl" target="_blank" rel="noopener noreferrer">
            parmyra.nl
          </a>
          .
        </p>
      </div>
    ),
  },
  noodnummers: {
    title: 'Noodnummers',
    subtitle: 'Plekhouder voor later',
    content: (
      <div className="info-content">
        <p>Hier kunnen we later telefoonnummers of noodcontacten neerzetten.</p>
      </div>
    ),
  },
};

function InfoPage() {
  const [activeSection, setActiveSection] = useState('toiletcode');

  return (
    <div className="info-page">
      <section className="info-section">
        <h2>Praktische informatie</h2>
        <p>Tik op een onderwerp om de juiste ledeninformatie te openen.</p>

        <div className="info-buttons">
          {INFO_SECTIONS.map(section => (
            <button
              key={section.id}
              className={`info-button ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>

        <div className="info-content-panel">
          <div className="info-panel-head">
            <h3>{INFO_CONTENT[activeSection].title}</h3>
            <p>{INFO_CONTENT[activeSection].subtitle}</p>
          </div>
          {INFO_CONTENT[activeSection].content}
        </div>
      </section>
    </div>
  );
}

export default InfoPage;
