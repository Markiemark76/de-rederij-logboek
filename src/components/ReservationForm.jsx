import { useState, useEffect } from "react";
import { calculateTotalPoints } from "../utils/pointsCalculator";
import "./ReservationForm.css";

export default function ReservationForm({ members, onReservationCreated }) {
  const [formData, setFormData] = useState({
    userId: "",
    datumStart: "",
    datumEind: "",
    opmerking: "",
  });

  const [calculatedPoints, setCalculatedPoints] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Bereken punten wanneer datums veranderen
  useEffect(() => {
    if (formData.datumStart && formData.datumEind) {
      const points = calculateTotalPoints(formData.datumStart, formData.datumEind);
      setCalculatedPoints(points);
    }
  }, [formData.datumStart, formData.datumEind]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.userId || !formData.datumStart || !formData.datumEind) {
      setError("Vul alstublieft alle verplichte velden in");
      return;
    }

    if (formData.datumStart > formData.datumEind) {
      setError("Einddatum kan niet voor startdatum liggen");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(formData.userId),
          datumStart: formData.datumStart,
          datumEind: formData.datumEind,
          puntenGebruikt: calculatedPoints,
          opmerking: formData.opmerking,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setFormData({ userId: "", datumStart: "", datumEind: "", opmerking: "" });
        setCalculatedPoints(0);
        onReservationCreated();
      } else {
        setError(result.error || "Fout bij reserveren");
      }
    } catch (err) {
      setError("Kan niet verbinden met server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedMember = members.find((m) => m.id === parseInt(formData.userId));

  return (
    <form className="reservation-form" onSubmit={handleSubmit}>
      <h3>Boot reserveren</h3>

      {error && <div className="error-message">{error}</div>}

      <div className="form-group">
        <label>Schipper *</label>
        <select
          name="userId"
          value={formData.userId}
          onChange={handleChange}
          required
        >
          <option value="">-- Kies schipper --</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Start datum *</label>
        <input
          type="date"
          name="datumStart"
          value={formData.datumStart}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Eind datum *</label>
        <input
          type="date"
          name="datumEind"
          value={formData.datumEind}
          onChange={handleChange}
          required
        />
      </div>

      {calculatedPoints > 0 && (
        <div className="points-info">
          <strong>Punten voor deze reservering: {calculatedPoints}</strong>
          {selectedMember && (
            <p>
              (Je hebt {selectedMember.shares * 28} punten beschikbaar per maand)
            </p>
          )}
        </div>
      )}

      <div className="form-group">
        <label>Opmerking</label>
        <textarea
          name="opmerking"
          value={formData.opmerking}
          onChange={handleChange}
          placeholder="Optioneel..."
          rows="3"
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? "Reserveren..." : "Boot reserveren"}
      </button>
    </form>
  );
}
