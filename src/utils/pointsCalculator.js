/**
 * Bereken hoeveel punten een zeildag waard is op basis van maand
 * @param {Date} date - De datum van de zeildag
 * @returns {number} - Aantal punten voor die dag
 */
export function getPointsForDay(date) {
  const month = new Date(date).getMonth(); // 0 = jan, 11 = dec

  // jan, feb, maart, nov, dec = 1 punt
  if ([0, 1, 2, 10, 11].includes(month)) return 1;

  // april, oktober = 2 punten
  if ([3, 9].includes(month)) return 2;

  // mei t/m september = 4 punten
  if ([4, 5, 6, 7, 8].includes(month)) return 4;

  return 0; // fallback
}

/**
 * Bereken totaal punten voor een reservering
 * @param {string} datumStart - Start datum (YYYY-MM-DD)
 * @param {string} datumEind - Eind datum (YYYY-MM-DD)
 * @returns {number} - Totaal punten
 */
export function calculateTotalPoints(datumStart, datumEind) {
  const start = new Date(datumStart);
  const end = new Date(datumEind);

  let totalPoints = 0;
  let current = new Date(start);

  // Loop door elke dag en tel punten op
  while (current <= end) {
    totalPoints += getPointsForDay(current);
    current.setDate(current.getDate() + 1);
  }

  return totalPoints;
}

/**
 * Bereken hoeveel punten iemand nog beschikbaar heeft
 * @param {number} shares - Aantal aandelen
 * @param {number} usedPoints - Totaal gebruikte punten deze maand
 * @returns {number} - Beschikbare punten
 */
export function getAvailablePoints(shares, usedPoints) {
  const pointsPerShare = 28; // Per aandeel 28 punten per maand
  const totalAvailable = shares * pointsPerShare;
  return totalAvailable - usedPoints;
}
