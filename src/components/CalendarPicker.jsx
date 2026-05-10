import { useState, useEffect } from "react";
import { calculateTotalPoints, getPointsForDay } from "../utils/pointsCalculator";
import "./CalendarPicker.css";

export default function CalendarPicker({ members, reservations, onReservationCreated }) {
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notes, setNotes] = useState("");

  // Maak map van geboekte dagen met schippernaam
  const bookedDaysMap = {};
  reservations.forEach((res) => {
    let current = new Date(res.datum_start);
    const end = new Date(res.datum_eind);
    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      bookedDaysMap[dateStr] = res.display_name;
      current.setDate(current.getDate() + 1);
    }
  });

  const bookedDays = new Set(Object.keys(bookedDaysMap));

  // Days of the week
  const daysOfWeek = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  // Get all days in month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  // Create array of days
  const calendarDays = [];
  for (let i = 0; i < firstDay - 1; i++) {
    calendarDays.push(null); // Empty cells
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Toggle day selection
  const toggleDay = (day) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split("T")[0];

    // Niet selecteren als al geboekt
    if (bookedDays.has(dateStr)) return;

    setSelectedDays((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      } else {
        return [...prev, dateStr];
      }
    });
  };

  // Calculate total points
  const totalPoints = selectedDays.reduce((sum, day) => {
    return sum + getPointsForDay(day);
  }, 0);

  const selectedMember = members.find((m) => m.id === parseInt(selectedMemberId));
  const availablePoints = selectedMember
    ? selectedMember.shares * 28 - totalPoints
    : 28;

  // Submit reservation
  const handleSubmit = async () => {
    if (!selectedMemberId || selectedDays.length === 0) {
      setError("Selecteer een schipper en minstens één dag");
      return;
    }

    const sortedDays = [...selectedDays].sort();
    const datumStart = sortedDays[0];
    const datumEind = sortedDays[sortedDays.length - 1];

    setLoading(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: parseInt(selectedMemberId),
          datumStart,
          datumEind,
          puntenGebruikt: totalPoints,
          opmerking: notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSelectedDays([]);
        setNotes("");
        setError(null);
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

  const monthName = currentMonth.toLocaleDateString("nl-NL", {
    month: "long",
    year: "numeric",
  });

  const canSubmit = selectedMemberId && selectedDays.length > 0 && availablePoints >= 0;

  return (
    <div className="calendar-picker">
      <h2>📅 Boot reserveren</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Schipper selector - BOVENAAN */}
      <div className="member-selector">
        <label>Schipper *</label>
        <select value={selectedMemberId} onChange={(e) => setSelectedMemberId(e.target.value)}>
          <option value="">-- Kies schipper --</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar - MIDDEN */}
      <div className="picker-calendar">
          <div className="calendar-header">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}>
              ←
            </button>
            <h3>{monthName}</h3>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}>
              →
            </button>
          </div>

          <div className="calendar-grid">
            {/* Days of week header */}
            {daysOfWeek.map((day) => (
              <div key={day} className="day-header">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((day, idx) => {
              if (!day) {
                return <div key={`empty-${idx}`} className="empty-cell"></div>;
              }

              const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
                .toISOString()
                .split("T")[0];

              const isBooked = bookedDays.has(dateStr);
              const isSelected = selectedDays.includes(dateStr);
              const pointsForDay = getPointsForDay(dateStr);
              const bookedByName = bookedDaysMap[dateStr];

              return (
                <button
                  key={day}
                  className={`calendar-day ${isBooked ? "booked" : ""} ${isSelected ? "selected" : ""}`}
                  onClick={() => toggleDay(day)}
                  disabled={isBooked}
                  title={
                    isBooked
                      ? `Geboekt door ${bookedByName}`
                      : `${pointsForDay} ${pointsForDay === 1 ? "punt" : "punten"}`
                  }
                >
                  <span className="day-number">{day}</span>
                  {isBooked ? (
                    <span className="day-skipper">{bookedByName}</span>
                  ) : (
                    <span className="day-points">{pointsForDay}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-item">
              <div className="legend-box selected"></div>
              <span>Geselecteerd</span>
            </div>
            <div className="legend-item">
              <div className="legend-box booked"></div>
              <span>Al geboekt</span>
            </div>
          </div>
        </div>

      {/* Info + Notes - ONDERAAN */}
      {selectedMember && (
        <div className="member-details">
          <div className="member-info">
            <p>
              <strong>Aandelen:</strong> {selectedMember.shares}
            </p>
            <p>
              <strong>Totale punten beschikbaar:</strong>{" "}
              <span className={availablePoints < 0 ? "warning" : ""}>
                {selectedMember.shares * 28}
              </span>
            </p>
          </div>

          <div className="notes-section">
            <label>Opmerking</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optioneel..."
              rows="2"
            />
          </div>
        </div>
      )}

      {/* Summary */}
      {selectedDays.length > 0 && (
        <div className="selection-summary">
          <div className="summary-item">
            <strong>Geselecteerde dagen:</strong> {selectedDays.length}
          </div>
          <div className="summary-item">
            <strong>Totaal punten:</strong> {totalPoints}
          </div>
          {selectedMember && (
            <div className={`summary-item ${availablePoints < 0 ? "warning" : ""}`}>
              <strong>Punten over:</strong> {availablePoints}
            </div>
          )}
        </div>
      )}

      {/* Submit button */}
      <div className="action-buttons">
        {selectedDays.length > 0 && (
          <button
            className="btn-reserve"
            onClick={handleSubmit}
            disabled={loading || !canSubmit}
          >
            {loading ? "Reserveren..." : `Reserveer (${selectedDays.length} ${selectedDays.length === 1 ? "dag" : "dagen"})`}
          </button>
        )}
        {selectedDays.length > 0 && (
          <button
            className="btn-clear"
            onClick={() => setSelectedDays([])}
            disabled={loading}
          >
            Wissen
          </button>
        )}
      </div>
    </div>
  );
}
