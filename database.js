const sqlite3 = require("sqlite3").verbose();

function initializeSchema(db) {

    db.serialize(() => {

        db.run(`
        CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            salary REAL,
            birthDate TEXT
        )
    `);

    });

    return db;

}

function createDatabase(dbPath = process.env.DB_PATH || "./benefits.db") {

    const db = new sqlite3.Database(dbPath);

    return initializeSchema(db);

}

module.exports = {
    createDatabase,
    initializeSchema
};
