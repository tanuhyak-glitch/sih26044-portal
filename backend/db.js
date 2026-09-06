// db.js
// A tiny file-backed JSON database. No native modules, no external DB server
// required — this keeps the prototype runnable on any judge's laptop with
// nothing but Node.js installed. Swap this module for a real database
// (Postgres/Mongo) later without touching route logic, since every route
// only calls the functions exported here.

const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "data", "db.json");

function emptyDb() {
  return {
    users: [],
    studentProfiles: [],
    opportunities: [],
    applications: [],
    notifications: [],
    skillsMaster: [],
    certificates: [],
    feedback: [],
    skillHistory: [],
    // Holds a registration until its OTP is verified. Never contains a
    // finished user account — see routes/auth.js.
    pendingRegistrations: [],
    nextId: {
      users: 1,
      opportunities: 1,
      applications: 1,
      notifications: 1,
      certificates: 1,
      feedback: 1,
      skillHistory: 1,
      pendingRegistrations: 1,
    },
  };
}

function load() {
  if (!fs.existsSync(DB_FILE)) {
    save(emptyDb());
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  try {
    const db = JSON.parse(raw);
    return migrate(db);
  } catch (e) {
    const fresh = emptyDb();
    save(fresh);
    return fresh;
  }
}

// Fills in any collections/counters added after a db.json was first created,
// so upgrading the code never breaks an existing demo database.
function migrate(db) {
  const fresh = emptyDb();
  for (const key of Object.keys(fresh)) {
    if (key === "nextId") continue;
    if (!(key in db)) db[key] = fresh[key];
  }
  db.nextId = { ...fresh.nextId, ...(db.nextId || {}) };
  return db;
}

function save(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

function nextId(db, collection) {
  const id = db.nextId[collection];
  db.nextId[collection] = id + 1;
  return id;
}

module.exports = { load, save, nextId, DB_FILE, emptyDb };
