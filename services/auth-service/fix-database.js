const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to the SQLite database
const dbPath = path.join(__dirname, 'prisma', 'dev.db');

console.log('Connecting to database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

// Check current table structure
db.all("PRAGMA table_info(teams)", (err, rows) => {
  if (err) {
    console.error('Error checking table structure:', err.message);
    return;
  }
  
  console.log('Current teams table structure:');
  rows.forEach(row => {
    console.log(`- ${row.name}: ${row.type} (nullable: ${!row.notnull})`);
  });
  
  // Check if city column exists
  const hasCity = rows.some(row => row.name === 'city');
  const hasCountry = rows.some(row => row.name === 'country');
  const hasMemberCount = rows.some(row => row.name === 'memberCount');
  const hasMaxMembers = rows.some(row => row.name === 'maxMembers');
  const hasSkills = rows.some(row => row.name === 'skills');
  const hasStatus = rows.some(row => row.name === 'status');
  
  console.log('\nMissing columns:');
  if (!hasCity) console.log('- city');
  if (!hasCountry) console.log('- country');
  if (!hasMemberCount) console.log('- memberCount');
  if (!hasMaxMembers) console.log('- maxMembers');
  if (!hasSkills) console.log('- skills');
  if (!hasStatus) console.log('- status');
  
  // Add missing columns
  const alterStatements = [];
  if (!hasCity) alterStatements.push("ALTER TABLE teams ADD COLUMN city TEXT NOT NULL DEFAULT 'Unknown'");
  if (!hasCountry) alterStatements.push("ALTER TABLE teams ADD COLUMN country TEXT NOT NULL DEFAULT 'Unknown'");
  if (!hasMemberCount) alterStatements.push("ALTER TABLE teams ADD COLUMN memberCount INTEGER NOT NULL DEFAULT 0");
  if (!hasMaxMembers) alterStatements.push("ALTER TABLE teams ADD COLUMN maxMembers INTEGER NOT NULL DEFAULT 10");
  if (!hasSkills) alterStatements.push("ALTER TABLE teams ADD COLUMN skills TEXT");
  if (!hasStatus) alterStatements.push("ALTER TABLE teams ADD COLUMN status TEXT NOT NULL DEFAULT 'Active'");
  
  if (alterStatements.length > 0) {
    console.log('\nAdding missing columns...');
    
    const addColumns = (index) => {
      if (index >= alterStatements.length) {
        console.log('✅ All columns added successfully!');
        db.close();
        return;
      }
      
      const statement = alterStatements[index];
      console.log(`Executing: ${statement}`);
      
      db.run(statement, (err) => {
        if (err) {
          console.error(`Error adding column: ${err.message}`);
        } else {
          console.log(`✅ Column added successfully`);
        }
        addColumns(index + 1);
      });
    };
    
    addColumns(0);
  } else {
    console.log('✅ All required columns already exist!');
    db.close();
  }
});

// Handle errors
db.on('error', (err) => {
  console.error('Database error:', err.message);
});
