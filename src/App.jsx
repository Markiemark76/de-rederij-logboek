import { useState, useEffect } from 'react';
import './App.css';
import LogbookForm from './components/LogbookForm';
import LogbookList from './components/LogbookList';
import InfoPage from './pages/InfoPage';

function App() {
  const [currentPage, setCurrentPage] = useState('logboek');
  const [members, setMembers] = useState([]);
  const [logbookEntries, setLogbookEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await fetch('/api/members');
        const result = await response.json();
        if (result.success) {
          setMembers(result.data);
        }
      } catch (err) {
        setError('Fout bij laden leden: ' + err.message);
      }
    };
    fetchMembers();
  }, []);

  // Fetch logbook entries
  useEffect(() => {
    const fetchLogbook = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/logbook');
        const result = await response.json();
        if (result.success) {
          setLogbookEntries(result.data);
        }
      } catch (err) {
        setError('Fout bij laden logboek: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogbook();
  }, [refreshKey]);

  const handleEntryAdded = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚤 de Rederij</h1>
        <p>Zeilclub Parmyra</p>
      </header>

      <nav className="app-nav">
        <button
          className={`nav-tab ${currentPage === 'logboek' ? 'active' : ''}`}
          onClick={() => setCurrentPage('logboek')}
        >
          📝 Logboek
        </button>
        <button
          className={`nav-tab ${currentPage === 'info' ? 'active' : ''}`}
          onClick={() => setCurrentPage('info')}
        >
          ℹ️ Informatie
        </button>
      </nav>

      <main className="app-content">
        {error && <div className="error-banner">{error}</div>}

        {currentPage === 'logboek' && (
          <>
            <section className="form-section">
              <h2>Nieuwe tocht vastleggen</h2>
              <LogbookForm members={members} onEntryAdded={handleEntryAdded} />
            </section>

            <section className="list-section">
              <h2>Logboek overzicht</h2>
              {loading ? (
                <p className="loading">Laden...</p>
              ) : logbookEntries.length === 0 ? (
                <p className="empty">Nog geen tochten vastgelegd.</p>
              ) : (
                <LogbookList entries={logbookEntries} />
              )}
            </section>
          </>
        )}

        {currentPage === 'info' && <InfoPage />}
      </main>

      <footer className="app-footer">
        <p>© 2026 de Rederij - Parmyra</p>
      </footer>
    </div>
  );
}

export default App;
