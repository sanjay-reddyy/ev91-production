-- Remove team and department references from users table
UPDATE users SET departmentId = NULL, teamId = NULL;

-- Drop foreign key constraints and columns
PRAGMA foreign_keys = OFF;

-- Create new users table without department and team references
CREATE TABLE users_new (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    phone TEXT,
    isActive BOOLEAN DEFAULT 1 NOT NULL,
    lastLoginAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updatedAt DATETIME NOT NULL,
    createdBy TEXT,
    updatedBy TEXT
);

-- Copy data from old table to new table
INSERT INTO users_new (id, email, password, firstName, lastName, phone, isActive, lastLoginAt, createdAt, updatedAt, createdBy, updatedBy)
SELECT id, email, password, firstName, lastName, phone, isActive, lastLoginAt, createdAt, updatedAt, createdBy, updatedBy
FROM users;

-- Drop old table and rename new table
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Drop department and team tables
DROP TABLE IF EXISTS teams;
DROP TABLE IF EXISTS departments;

PRAGMA foreign_keys = ON;
