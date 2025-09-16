-- EV91 Platform Sample Database Schema
-- This is a sample backup file for demonstration purposes
-- Created: August 30, 2025
-- Database: ev91platform

-- Note: This is a template/sample file. To create an actual backup, run:
-- psql -h localhost -U ev91user -d ev91platform -f database-backup/handover/export-database.ps1
-- OR use the export scripts provided in this directory

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS ev91platform;
USE ev91platform;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles table for RBAC
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    department_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vin VARCHAR(17) UNIQUE NOT NULL,
    model_id UUID,
    license_plate VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Vehicle models table
CREATE TABLE IF NOT EXISTS vehicle_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255),
    type VARCHAR(100),
    year INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    client_id UUID,
    address TEXT,
    manager_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Riders table
CREATE TABLE IF NOT EXISTS riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    license_number VARCHAR(50),
    phone VARCHAR(20),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Spare parts table
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    part_number VARCHAR(100) UNIQUE,
    category_id UUID,
    stock_quantity INTEGER DEFAULT 0,
    unit_price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories table for spare parts
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin user
INSERT INTO users (email, password, first_name, last_name, role) VALUES
('admin@ev91platform.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LCF3RHLB6z.0v5.yS', 'Admin', 'User', 'SUPER_ADMIN')
ON CONFLICT (email) DO NOTHING;

-- Insert default roles
INSERT INTO roles (name, description) VALUES
('SUPER_ADMIN', 'Full system access'),
('ADMIN', 'Administrative access'),
('MANAGER', 'Manager level access'),
('USER', 'Basic user access')
ON CONFLICT (name) DO NOTHING;

-- Insert sample departments
INSERT INTO departments (name, description) VALUES
('Engineering', 'Software and hardware development'),
('Operations', 'Daily operations and logistics'),
('Support', 'Customer support and maintenance'),
('Sales', 'Sales and business development')
ON CONFLICT (name) DO NOTHING;

-- Insert sample vehicle models
INSERT INTO vehicle_models (name, manufacturer, type, year) VALUES
('Model S', 'Tesla', 'Electric Sedan', 2023),
('Model 3', 'Tesla', 'Electric Sedan', 2023),
('Leaf', 'Nissan', 'Electric Hatchback', 2023),
('i3', 'BMW', 'Electric City Car', 2023),
('e-tron', 'Audi', 'Electric SUV', 2023)
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('Battery Components', 'Battery related parts and components'),
('Motors', 'Electric motors and related parts'),
('Charging', 'Charging ports and cables'),
('Electronics', 'Electronic components and sensors'),
('Body Parts', 'Vehicle body and exterior parts')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraints
ALTER TABLE teams ADD CONSTRAINT fk_teams_department
    FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE vehicles ADD CONSTRAINT fk_vehicles_model
    FOREIGN KEY (model_id) REFERENCES vehicle_models(id);

ALTER TABLE stores ADD CONSTRAINT fk_stores_client
    FOREIGN KEY (client_id) REFERENCES clients(id);

ALTER TABLE riders ADD CONSTRAINT fk_riders_user
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE spare_parts ADD CONSTRAINT fk_spare_parts_category
    FOREIGN KEY (category_id) REFERENCES categories(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_vehicles_vin ON vehicles(vin);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON spare_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_riders_status ON riders(status);

-- End of sample database schema
