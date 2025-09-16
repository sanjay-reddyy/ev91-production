-- ============================================================================
-- EV91 Platform Database Seed Data
-- This script populates the database with essential OEMs, Vehicle Models,
-- and sample vehicles for development and testing
-- ============================================================================

-- Insert Electric Two-Wheeler OEMs
INSERT INTO oems (id, name, code, "displayName", country, "isPreferred", "createdAt", "updatedAt") VALUES
('oem_hero', 'Hero Electric', 'HERO', 'Hero Electric', 'India', true, NOW(), NOW()),
('oem_ather', 'Ather Energy', 'ATHER', 'Ather Energy', 'India', true, NOW(), NOW()),
('oem_ola', 'Ola Electric', 'OLA', 'Ola Electric', 'India', true, NOW(), NOW()),
('oem_tvs', 'TVS Motor Company', 'TVS', 'TVS Motor', 'India', true, NOW(), NOW()),
('oem_bajaj', 'Bajaj Auto', 'BAJAJ', 'Bajaj Auto', 'India', true, NOW(), NOW()),
('oem_revolt', 'Revolt Motors', 'REVOLT', 'Revolt Motors', 'India', true, NOW(), NOW()),
('oem_ampere', 'Ampere Vehicles', 'AMPERE', 'Ampere Vehicles', 'India', false, NOW(), NOW()),
('oem_simple', 'Simple Energy', 'SIMPLE', 'Simple Energy', 'India', false, NOW(), NOW()),
('oem_pure', 'Pure EV', 'PURE', 'Pure EV', 'India', false, NOW(), NOW()),
('oem_okinawa', 'Okinawa Autotech', 'OKINAWA', 'Okinawa', 'India', false, NOW(), NOW()),
('oem_beguass', 'Beguass Electric', 'BEGUASS', 'Beguass Electric', 'India', true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "isPreferred" = EXCLUDED."isPreferred",
    "updatedAt" = NOW();

-- Insert Vehicle Models for Hero Electric
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_hero_photon', 'oem_hero', 'Photon', 'Hero Photon', 'HPH', 'Scooter', 'Entry', 'Electric', 'Electric', '48V', 45, 85, 2, 75000, true, NOW(), NOW()),
('model_hero_optima', 'oem_hero', 'Optima', 'Hero Optima', 'HOP', 'Scooter', 'Entry', 'Electric', 'Electric', '48V', 25, 60, 2, 65000, true, NOW(), NOW()),
('model_hero_dash', 'oem_hero', 'Dash', 'Hero Dash', 'HDA', 'Scooter', 'Entry', 'Electric', 'Electric', '48V', 25, 60, 2, 68000, true, NOW(), NOW()),
('model_hero_nyx', 'oem_hero', 'NYX', 'Hero NYX', 'HNY', 'Scooter', 'Entry', 'Electric', 'Electric', '48V', 45, 65, 2, 72000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Vehicle Models for Ather Energy
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_ather_450x', 'oem_ather', '450X', 'Ather 450X', 'A450X', 'Scooter', 'Premium', 'Electric', 'Electric', '2.9kWh', 80, 116, 2, 155000, true, NOW(), NOW()),
('model_ather_450plus', 'oem_ather', '450 Plus', 'Ather 450 Plus', 'A450P', 'Scooter', 'Premium', 'Electric', 'Electric', '2.9kWh', 70, 70, 2, 140000, true, NOW(), NOW()),
('model_ather_rizta', 'oem_ather', 'Rizta', 'Ather Rizta', 'ARIZ', 'Scooter', 'Premium', 'Electric', 'Electric', '3.7kWh', 80, 123, 2, 165000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Vehicle Models for Ola Electric
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_ola_s1', 'oem_ola', 'S1', 'Ola S1', 'OS1', 'Scooter', 'Premium', 'Electric', 'Electric', '3.97kWh', 90, 181, 2, 125000, true, NOW(), NOW()),
('model_ola_s1pro', 'oem_ola', 'S1 Pro', 'Ola S1 Pro', 'OS1P', 'Scooter', 'Premium', 'Electric', 'Electric', '3.97kWh', 115, 195, 2, 140000, true, NOW(), NOW()),
('model_ola_s1air', 'oem_ola', 'S1 Air', 'Ola S1 Air', 'OS1A', 'Scooter', 'Entry', 'Electric', 'Electric', '2.5kWh', 85, 101, 2, 105000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Vehicle Models for TVS Motor
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_tvs_iqube', 'oem_tvs', 'iQube', 'TVS iQube', 'TIQ', 'Scooter', 'Premium', 'Electric', 'Electric', '4.4kWh', 78, 150, 2, 125000, true, NOW(), NOW()),
('model_tvs_iqube_st', 'oem_tvs', 'iQube ST', 'TVS iQube ST', 'TIQST', 'Scooter', 'Premium', 'Electric', 'Electric', '5.0kWh', 82, 145, 2, 135000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Vehicle Models for Bajaj Auto
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_bajaj_chetak', 'oem_bajaj', 'Chetak', 'Bajaj Chetak', 'BCH', 'Scooter', 'Premium', 'Electric', 'Electric', '3.0kWh', 73, 108, 2, 155000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Vehicle Models for Revolt Motors
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_revolt_rv400', 'oem_revolt', 'RV400', 'Revolt RV400', 'RV400', 'Motorcycle', 'Premium', 'Electric', 'Electric', '3.24kWh', 85, 150, 2, 145000, true, NOW(), NOW()),
('model_revolt_rv1', 'oem_revolt', 'RV1', 'Revolt RV1', 'RV1', 'Motorcycle', 'Entry', 'Electric', 'Electric', '2.5kWh', 70, 100, 2, 125000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Vehicle Models for Beguass Electric
INSERT INTO vehicle_models (id, "oemId", name, "displayName", "modelCode", category, segment, "vehicleType", "fuelType", "batteryCapacity", "maxSpeed", range, "seatingCapacity", "basePrice", "isActive", "createdAt", "updatedAt") VALUES
('model_beguass_g1', 'oem_beguass', 'G1', 'Beguass G1', 'BG1', 'Scooter', 'Entry', 'Electric', 'Electric', '3.2kWh', 75, 120, 2, 85000, true, NOW(), NOW()),
('model_beguass_g2', 'oem_beguass', 'G2', 'Beguass G2', 'BG2', 'Scooter', 'Premium', 'Electric', 'Electric', '4.0kWh', 80, 140, 2, 95000, true, NOW(), NOW()),
('model_beguass_g3_pro', 'oem_beguass', 'G3 Pro', 'Beguass G3 Pro', 'BG3P', 'Scooter', 'Premium', 'Electric', 'Electric', '4.8kWh', 85, 160, 2, 120000, true, NOW(), NOW()),
('model_beguass_urban', 'oem_beguass', 'Urban', 'Beguass Urban', 'BGU', 'Scooter', 'Entry', 'Electric', 'Electric', '2.8kWh', 65, 100, 2, 75000, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "displayName" = EXCLUDED."displayName",
    "batteryCapacity" = EXCLUDED."batteryCapacity",
    range = EXCLUDED.range,
    "maxSpeed" = EXCLUDED."maxSpeed",
    "updatedAt" = NOW();

-- Insert Sample Vehicles for Testing
INSERT INTO vehicles (id, "modelId", "registrationNumber", color, year, "chassisNumber", "engineNumber", variant, "batteryCapacity", "maxRange", "maxSpeed", "purchaseDate", "registrationDate", "purchasePrice", "currentValue", "operationalStatus", "serviceStatus", mileage, location, "ageInMonths", "hubId", "createdAt", "updatedAt") VALUES
('vehicle_001', 'model_hero_photon', 'DL01AB1001', 'Red', 2024, 'HERO001PHO2024', NULL, 'Standard', 48, 85, 45, '2024-01-15', '2024-01-20', 75000, 65000, 'Available', 'Active', 2450, 'Delhi Hub', 7, 'hub_delhi_cp', NOW(), NOW()),
('vehicle_002', 'model_ather_450x', 'MH02CD2002', 'White', 2024, 'ATHER002450X2024', NULL, 'Pro', 2900, 116, 80, '2024-02-10', '2024-02-15', 155000, 140000, 'Available', 'Active', 1890, 'Mumbai Hub', 6, 'hub_mumbai_central', NOW(), NOW()),
('vehicle_003', 'model_ola_s1pro', 'KA03EF3003', 'Black', 2024, 'OLA003S1PRO2024', NULL, 'Pro+', 3970, 195, 115, '2024-03-05', '2024-03-10', 180000, 165000, 'Assigned', 'Active', 3200, 'Bangalore Hub', 5, 'hub_bangalore_koramangala', NOW(), NOW()),
('vehicle_004', 'model_tvs_iqube', 'TN04GH4004', 'Blue', 2024, 'TVS004IQUBE2024', NULL, 'Electric', 4400, 150, 78, '2024-01-25', '2024-01-30', 125000, 110000, 'Available', 'Active', 2100, 'Chennai Hub', 6, 'hub_chennai_omr', NOW(), NOW()),
('vehicle_005', 'model_revolt_rv400', 'GJ05IJ5005', 'Orange', 2024, 'REVOLT005RV4002024', NULL, 'Standard', 3240, 150, 85, '2024-04-01', '2024-04-05', 145000, 135000, 'Under Maintenance', 'Scheduled for Service', 1750, 'Ahmedabad Hub', 4, 'hub_ahmedabad_sg', NOW(), NOW()),
('vehicle_006', 'model_beguass_g2', 'HR06KL6006', 'Silver', 2024, 'BEGUASS006G22024', NULL, 'Standard', 4000, 140, 80, '2024-03-20', '2024-03-25', 95000, 85000, 'Available', 'Active', 1600, 'Gurgaon Hub', 5, 'hub_delhi_gurgaon', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    color = EXCLUDED.color,
    "operationalStatus" = EXCLUDED."operationalStatus",
    "serviceStatus" = EXCLUDED."serviceStatus",
    mileage = EXCLUDED.mileage,
    location = EXCLUDED.location,
    "currentValue" = EXCLUDED."currentValue",
    "updatedAt" = NOW();

-- Insert RC Details for Sample Vehicles
INSERT INTO rc_details (id, "vehicleId", "rcNumber", "ownerName", "ownerAddress", "registrationDate", "validUpto", "fuelType", "seatingCapacity", "createdAt", "updatedAt") VALUES
('rc_001', 'vehicle_001', 'DL01AB1001', 'EV91 Fleet Solutions', 'Sector 15, Noida, Delhi NCR, 201301', '2024-01-20', '2039-01-20', 'Electric', 2, NOW(), NOW()),
('rc_002', 'vehicle_002', 'MH02CD2002', 'EV91 Fleet Solutions', 'Andheri East, Mumbai, Maharashtra, 400069', '2024-02-15', '2039-02-15', 'Electric', 2, NOW(), NOW()),
('rc_003', 'vehicle_003', 'KA03EF3003', 'EV91 Fleet Solutions', 'Electronic City, Bangalore, Karnataka, 560100', '2024-03-10', '2039-03-10', 'Electric', 2, NOW(), NOW()),
('rc_004', 'vehicle_004', 'TN04GH4004', 'EV91 Fleet Solutions', 'OMR, Chennai, Tamil Nadu, 600096', '2024-01-30', '2039-01-30', 'Electric', 2, NOW(), NOW()),
('rc_005', 'vehicle_005', 'GJ05IJ5005', 'EV91 Fleet Solutions', 'SG Highway, Ahmedabad, Gujarat, 380015', '2024-04-05', '2039-04-05', 'Electric', 2, NOW(), NOW()),
('rc_006', 'vehicle_006', 'HR06KL6006', 'EV91 Fleet Solutions', 'Cyber City, Gurgaon, Haryana, 122002', '2024-03-25', '2039-03-25', 'Electric', 2, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    "ownerName" = EXCLUDED."ownerName",
    "ownerAddress" = EXCLUDED."ownerAddress",
    "validUpto" = EXCLUDED."validUpto",
    "updatedAt" = NOW();

-- Insert Insurance Details for Sample Vehicles  
INSERT INTO insurance_details (id, "vehicleId", "policyNumber", "providerName", "insuranceType", "policyStartDate", "policyEndDate", "premiumAmount", "coverageAmount", "isActive", "renewalReminder", "createdAt", "updatedAt") VALUES
('ins_001', 'vehicle_001', 'HDFC001EV2024', 'HDFC ERGO General Insurance', 'Comprehensive', '2024-01-20', '2025-01-20', 8500, 75000, true, true, NOW(), NOW()),
('ins_002', 'vehicle_002', 'ICICI002EV2024', 'ICICI Lombard General Insurance', 'Comprehensive', '2024-02-15', '2025-02-15', 12000, 155000, true, true, NOW(), NOW()),
('ins_003', 'vehicle_003', 'BAJAJ003EV2024', 'Bajaj Allianz General Insurance', 'Comprehensive', '2024-03-10', '2025-03-10', 15000, 180000, true, true, NOW(), NOW()),
('ins_004', 'vehicle_004', 'TATA004EV2024', 'Tata AIG General Insurance', 'Comprehensive', '2024-01-30', '2025-01-30', 10500, 125000, true, true, NOW(), NOW()),
('ins_005', 'vehicle_005', 'NAVI005EV2024', 'Navi General Insurance', 'Comprehensive', '2024-04-05', '2025-04-05', 11000, 145000, true, true, NOW(), NOW()),
('ins_006', 'vehicle_006', 'HDFC006EV2024', 'HDFC ERGO General Insurance', 'Comprehensive', '2024-03-25', '2025-03-25', 7500, 95000, true, true, NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    "providerName" = EXCLUDED."providerName",
    "policyEndDate" = EXCLUDED."policyEndDate",
    "premiumAmount" = EXCLUDED."premiumAmount",
    "coverageAmount" = EXCLUDED."coverageAmount",
    "updatedAt" = NOW();

-- Update sequence values to prevent ID conflicts
SELECT setval('oems_id_seq', (SELECT MAX(LENGTH(id)) FROM oems) + 100, false) WHERE EXISTS (SELECT 1 FROM oems);
SELECT setval('vehicle_models_id_seq', (SELECT MAX(LENGTH(id)) FROM vehicle_models) + 100, false) WHERE EXISTS (SELECT 1 FROM vehicle_models);
SELECT setval('vehicles_id_seq', (SELECT MAX(LENGTH(id)) FROM vehicles) + 100, false) WHERE EXISTS (SELECT 1 FROM vehicles);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles("registrationNumber");
CREATE INDEX IF NOT EXISTS idx_vehicles_model ON vehicles("modelId");
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles("operationalStatus", "serviceStatus");
CREATE INDEX IF NOT EXISTS idx_vehicle_models_oem ON vehicle_models("oemId");
CREATE INDEX IF NOT EXISTS idx_rc_details_vehicle ON rc_details("vehicleId");
CREATE INDEX IF NOT EXISTS idx_insurance_details_vehicle ON insurance_details("vehicleId");

-- Insert sample vehicle status history
INSERT INTO vehicle_status_history (id, "vehicleId", "newStatus", "changeReason", "changedBy", "createdAt") VALUES
('status_001', 'vehicle_001', 'Available', 'Vehicle created and ready for assignment', 'system', NOW()),
('status_002', 'vehicle_002', 'Available', 'Vehicle created and ready for assignment', 'system', NOW()),
('status_003', 'vehicle_003', 'Assigned', 'Vehicle assigned to rider', 'admin_user', NOW()),
('status_004', 'vehicle_004', 'Available', 'Vehicle created and ready for assignment', 'system', NOW()),
('status_005', 'vehicle_005', 'Under Maintenance', 'Scheduled maintenance due', 'maintenance_team', NOW()),
('status_006', 'vehicle_006', 'Available', 'Vehicle created and ready for assignment', 'system', NOW())
ON CONFLICT (id) DO UPDATE SET
    "newStatus" = EXCLUDED."newStatus",
    "changeReason" = EXCLUDED."changeReason";

-- Database seeded successfully with OEMs, Vehicle Models, and Sample Vehicles
SELECT 'Database seeded successfully with OEMs, Vehicle Models, and Sample Vehicles' as message;
