const fs = require("fs");
const path = require("path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIR = path.join(__dirname, "data");
const DB_PATH = path.join(DATA_DIR, "rederij.sqlite");

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON;");

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
    created_by INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (skipper_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
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
      entry_date, skipper_id, crew_members,
      wind_force, motor_hours_start, motor_hours_end, departure_port, arrival_port,
      diesel_taken, water_remaining, diesel_remaining,
      damage, notes, created_by, created_at, updated_at
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
      crew_members = ?, wind_force = ?, motor_hours_start = ?, motor_hours_end = ?,
      departure_port = ?, arrival_port = ?, diesel_taken = ?,
      water_remaining = ?, diesel_remaining = ?, damage = ?, notes = ?,
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
    entry.crewMembers || null,
    entry.windForce || null,
    entry.motorHoursStart || null,
    entry.motorHoursEnd || null,
    entry.departurePort || null,
    entry.arrivalPort || null,
    entry.dieselTaken || null,
    entry.waterRemaining || null,
    entry.dieselRemaining || null,
    entry.damage || null,
    entry.notes || null,
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
    entry.crewMembers || null,
    entry.windForce || null,
    entry.motorHoursStart || null,
    entry.motorHoursEnd || null,
    entry.departurePort || null,
    entry.arrivalPort || null,
    entry.dieselTaken || null,
    entry.waterRemaining || null,
    entry.dieselRemaining || null,
    entry.damage || null,
    entry.notes || null,
    now,
    id
  );
  return getLogbookEntry(id);
}

function deleteLogbookEntry(id) {
  statements.deleteLogbookEntry.run(id);
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
};

// Initialize default users on startup
initializeDefaultUsers();
