import { useEffect, useState } from "react";
import "./ReservationList.css";

export default function ReservationList({ refreshKey }) {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReservations();
  }, [refreshKey]);

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/reservations");
      const result = await response.json();

      if (result.success) {
        setReservations(result.data);
      } else {
        setError("Kan reserveringen niet laden");
      }
    } catch (err) {
      setError("Fout bij laden reserveringen");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm("Zeker weten dat je deze reservering wilt annuleren?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        fetchReservations();
      } else {
        alert("Fout bij annuleren");
      }
    } catch (err) {
      alert("Kan niet verbinden met server");
      console.error(err);
    }
  };

  if (loading) return <div className="loading">Reserveringen laden...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="reservation-list">
      <h3>Planning — Alle reserveringen</h3>

      {reservations.length === 0 ? (
        <p className="no-reservations">Nog geen reserveringen</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Schipper</th>
              <th>Start datum</th>
              <th>Eind datum</th>
              <th>Punten</th>
              <th>Opmerking</th>
              <th>Actie</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <tr key={res.id}>
                <td>{res.display_name}</td>
                <td>{new Date(res.datum_start).toLocaleDateString("nl-NL")}</td>
                <td>{new Date(res.datum_eind).toLocaleDateString("nl-NL")}</td>
                <td className="points">{res.punten_gebruikt}</td>
                <td>{res.opmerking || "-"}</td>
                <td>
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancel(res.id)}
                  >
                    Annuleren
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
