-- Schema Migration: Remove Duplicate Fields from Employee Table
-- Generated: 2025-09-06T09:27:21.316Z

-- Step 1: Remove duplicate columns from employees table
-- Note: firstName, lastName, email, isActive will be accessed via User relation

-- Step 2: Remove legacy role column from users table  
-- Note: Roles are now managed via UserRole table

-- These changes maintain data integrity while removing duplication
-- All authentication will use User table as primary source
-- Employee table focuses only on organizational/work context

-- Migration will be applied via Prisma schema changes and database reset for development
