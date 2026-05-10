const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "rederij.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");

// Migrations
try {
  db.exec("ALTER TABLE logbook_entries ADD COLUMN status TEXT NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'definitief'))");
} catch (err) {
  // Kolom bestaat al
}

try {
  db.exec("ALTER TABLE logbook_entries ADD COLUMN departure_date TEXT");
} catch (err) {
  // Kolom bestaat al
}

try {
  db.exec("ALTER TABLE logbook_entries ADD COLUMN arrival_date TEXT");
} catch (err) {
  // Kolom bestaat al
}

try {
  db.exec("ALTER TABLE logbook_entries ADD COLUMN motor_hours_diesel_refuel REAL");
} catch (err) {
  // Kolom bestaat al
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('member', 'board', 'admin')),
    shares INTEGER NOT NULL DEFAULT 1,
    is_active INTEGER NOT NULL DEFAULT 1,
    password_hash TEXT,
    password_salt TEXT,
    invite_token_hash TEXT,
    invite_expires_at TEXT,
    last_password_set_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS logbook_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_date TEXT NOT NULL,
    skipper_id INTEGER NOT NULL,
    crew_members TEXT,
    wind_force TEXT,
    motor_hours_start REAL,
    motor_hours_end REAL,
    departure_port TEXT,
    arrival_port TEXT,
    diesel_taken REAL,
    water_remaining REAL,
    diesel_remaining TEXT,
    damage TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'concept' CHECK (status IN ('concept', 'definitief')),
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (skipper_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    datum_start TEXT NOT NULL,
    datum_eind TEXT NOT NULL,
    punten_gebruikt INTEGER NOT NULL,
    opmerking TEXT,
    status TEXT NOT NULL DEFAULT 'geboekt' CHECK (status IN ('geboekt', 'geannuleerd')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

const statements = {
  countUsers: db.prepare("SELECT COUNT(*) AS count FROM users"),
  listUsers: db.prepare(`
    SELECT id, email, display_name, role, shares, is_active,
           invite_expires_at, last_password_set_at, created_at, updated_at
    FROM users
    WHERE is_active = 1
    ORDER BY lower(display_name) ASC
  `),
  getUserById: db.prepare(`
    SELECT id, email, display_name, role, shares, is_active, password_hash, password_salt,
           invite_token_hash, invite_expires_at, last_password_set_at, created_at, updated_at
    FROM users
    WHERE id = ?
  `),

  // Logbook statements
  createLogbookEntry: db.prepare(`
    INSERT INTO logbook_entries (
      entry_date, skipper_id,
      motor_hours_start, motor_hours_end, departure_date, arrival_date,
      diesel_taken, motor_hours_diesel_refuel, water_remaining, diesel_remaining,
      damage, notes, status, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getLogbookEntry: db.prepare(`
    SELECT * FROM logbook_entries WHERE id = ?
  `),
  listLogbookEntries: db.prepare(`
    SELECT le.*, u.display_name as skipper_name
    FROM logbook_entries le
    JOIN users u ON u.id = le.skipper_id
    ORDER BY le.entry_date DESC
  `),
  updateLogbookEntry: db.prepare(`
    UPDATE logbook_entries SET
      entry_date = ?, skipper_id = ?,
      motor_hours_start = ?, motor_hours_end = ?,
      departure_date = ?, arrival_date = ?, diesel_taken = ?, motor_hours_diesel_refuel = ?,
      water_remaining = ?, diesel_remaining = ?, damage = ?, notes = ?, status = ?,
      updated_at = ?
    WHERE id = ?
  `),
  deleteLogbookEntry: db.prepare(`
    DELETE FROM logbook_entries WHERE id = ?
  `),
  insertUser: db.prepare(`
    INSERT INTO users (email, display_name, role, shares, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, 1, ?, ?)
  `),
  // Reservations
  createReservation: db.prepare(`
    INSERT INTO reservations (user_id, datum_start, datum_eind, punten_gebruikt, opmerking, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  getReservation: db.prepare(`
    SELECT * FROM reservations WHERE id = ?
  `),
  listReservations: db.prepare(`
    SELECT r.*, u.display_name, u.shares
    FROM reservations r
    JOIN users u ON u.id = r.user_id
    WHERE r.status = 'geboekt'
    ORDER BY r.datum_start ASC
  `),
  listReservationsByUser: db.prepare(`
    SELECT * FROM reservations WHERE user_id = ? AND status = 'geboekt' ORDER BY datum_start ASC
  `),
  updateReservation: db.prepare(`
    UPDATE reservations SET datum_start = ?, datum_eind = ?, punten_gebruikt = ?, opmerking = ?, updated_at = ? WHERE id = ?
  `),
  deleteReservation: db.prepare(`
    UPDATE reservations SET status = 'geannuleerd', updated_at = ? WHERE id = ?
  `),
};

function nowIso() {
  return new Date().toISOString();
}

function mapPublicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    shares: row.shares,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
  };
}

function listUsers() {
  return statements.listUsers.all().map(mapPublicUser);
}

function getUserById(id) {
  return statements.getUserById.get(id) || null;
}

// Logbook functions
function createLogbookEntry(entry) {
  const now = nowIso();
  const result = statements.createLogbookEntry.run(
    entry.entryDate,
    entry.skipperId,
    entry.motorHoursStart || null,
    entry.motorHoursEnd || null,
    entry.departureDate || null,
    entry.arrivalDate || null,
    entry.dieselTaken || null,
    entry.motorHoursDieselRefuel || null,
    entry.waterRemaining || null,
    entry.dieselRemaining || null,
    entry.damage || null,
    entry.notes || null,
    entry.status || 'concept',
    entry.createdBy,
    now,
    now
  );
  return getLogbookEntry(result.lastInsertRowid);
}

function getLogbookEntry(id) {
  return statements.getLogbookEntry.get(id) || null;
}

function listLogbookEntries() {
  return statements.listLogbookEntries.all() || [];
}

function updateLogbookEntry(id, entry) {
  const now = nowIso();
  statements.updateLogbookEntry.run(
    entry.entryDate,
    entry.skipperId,
    entry.motorHoursStart || null,
    entry.motorHoursEnd || null,
    entry.departureDate || null,
    entry.arrivalDate || null,
    entry.dieselTaken || null,
    entry.motorHoursDieselRefuel || null,
    entry.waterRemaining || null,
    entry.dieselRemaining || null,
    entry.damage || null,
    entry.notes || null,
    entry.status || 'concept',
    now,
    id
  );
  return getLogbookEntry(id);
}

function deleteLogbookEntry(id) {
  statements.deleteLogbookEntry.run(id);
  return true;
}

// Reservations functions
function createReservation(reservation) {
  const now = nowIso();
  const result = statements.createReservation.run(
    reservation.userId,
    reservation.datumStart,
    reservation.datumEind,
    reservation.puntenGebruikt,
    reservation.opmerking || null,
    now,
    now
  );
  return getReservation(result.lastInsertRowid);
}

function getReservation(id) {
  return statements.getReservation.get(id) || null;
}

function listReservations() {
  return statements.listReservations.all() || [];
}

function listReservationsByUser(userId) {
  return statements.listReservationsByUser.all(userId) || [];
}

function updateReservation(id, reservation) {
  const now = nowIso();
  statements.updateReservation.run(
    reservation.datumStart,
    reservation.datumEind,
    reservation.puntenGebruikt,
    reservation.opmerking || null,
    now,
    id
  );
  return getReservation(id);
}

function deleteReservation(id) {
  const now = nowIso();
  statements.deleteReservation.run(now, id);
  return true;
}

function initializeDefaultUsers() {
  const countResult = statements.countUsers.get();
  if (countResult.count === 0) {
    const now = nowIso();
    const defaultUsers = [
      { email: 'mark@parmyra.nl', displayName: 'Mark van Gerven' },
      { email: 'jan@parmyra.nl', displayName: 'Jan de Vries' },
      { email: 'marie@parmyra.nl', displayName: 'Marie Jansen' },
      { email: 'peter@parmyra.nl', displayName: 'Peter Dekker' },
      { email: 'anna@parmyra.nl', displayName: 'Anna van den Berg' },
      { email: 'koos@parmyra.nl', displayName: 'Koos Willems' },
      { email: 'linda@parmyra.nl', displayName: 'Linda Smit' },
      { email: 'tom@parmyra.nl', displayName: 'Tom Bakker' },
    ];

    defaultUsers.forEach(user => {
      statements.insertUser.run(
        user.email,
        user.displayName,
        'member',
        1,
        now,
        now
      );
    });
  }
}

module.exports = {
  DB_PATH,
  listUsers,
  getUserById,
  createLogbookEntry,
  getLogbookEntry,
  listLogbookEntries,
  updateLogbookEntry,
  deleteLogbookEntry,
  createReservation,
  getReservation,
  listReservations,
  listReservationsByUser,
  updateReservation,
  deleteReservation,
};

// Initialize default users on startup
initializeDefaultUsers();
