const Database = require('better-sqlite3');
const db = new Database('./backend/nextforge.sqlite');
console.log(db.pragma('table_info(machines_cache)'));
