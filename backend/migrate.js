const Database = require('better-sqlite3');
const db = new Database('nextforge.sqlite');
try { db.exec("ALTER TABLE machines_cache ADD COLUMN price REAL;"); } catch(e){}
try { db.exec("ALTER TABLE machines_cache ADD COLUMN materials TEXT;"); } catch(e){}
try { db.exec("ALTER TABLE machines_cache ADD COLUMN owner TEXT;"); } catch(e){}
console.log("Migration done.");
