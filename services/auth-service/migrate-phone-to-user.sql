-- Migration: Move phone numbers from employee table to user table
-- This script safely migrates existing phone data and removes the redundant column

-- Step 1: Copy existing phone numbers from employee to user table (if any exist)
UPDATE users
SET phone = employees.phone
FROM employees
WHERE users.id = employees."userId"
  AND employees.phone IS NOT NULL
  AND employees.phone != ''
  AND (users.phone IS NULL OR users.phone = '');

-- Step 2: Verify that all non-empty phone numbers have been copied
-- (Run this as a check - should return 0 rows)
-- SELECT e.id, e.phone, u.phone as user_phone
-- FROM employees e
-- JOIN users u ON u.id = e."userId"
-- WHERE e.phone IS NOT NULL
--   AND e.phone != ''
--   AND (u.phone IS NULL OR u.phone = '');

-- Step 3: Remove the phone column from the employee table
ALTER TABLE employees DROP COLUMN phone;

-- Step 4: Add a comment to document this change
COMMENT ON TABLE users IS 'User table contains personal information including phone numbers (moved from employees table)';
