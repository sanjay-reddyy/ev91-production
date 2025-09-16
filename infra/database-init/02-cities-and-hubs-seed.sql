-- ============================================================================
-- City and Hub Seed Data for EV91 Platform
-- This script creates cities and hubs, and assigns existing vehicles to hubs
-- ============================================================================

-- Insert Cities
INSERT INTO cities (id, name, code, state, "stateCode", country, "countryCode", "regionCode", "pinCode", latitude, longitude, timezone, "isActive", "isOperational", "marketPotential", "createdAt", "updatedAt") VALUES
('city_mumbai', 'Mumbai', 'MUM', 'Maharashtra', 'MH', 'India', 'IN', 'WR', '400001', 19.0760, 72.8777, 'Asia/Kolkata', true, true, 'High', NOW(), NOW()),
('city_delhi', 'Delhi', 'DEL', 'Delhi', 'DL', 'India', 'IN', 'NR', '110001', 28.7041, 77.1025, 'Asia/Kolkata', true, true, 'High', NOW(), NOW()),
('city_bangalore', 'Bangalore', 'BLR', 'Karnataka', 'KA', 'India', 'IN', 'SR', '560001', 12.9716, 77.5946, 'Asia/Kolkata', true, true, 'High', NOW(), NOW()),
('city_hyderabad', 'Hyderabad', 'HYD', 'Telangana', 'TG', 'India', 'IN', 'SR', '500001', 17.3850, 78.4867, 'Asia/Kolkata', true, true, 'High', NOW(), NOW()),
('city_chennai', 'Chennai', 'CHE', 'Tamil Nadu', 'TN', 'India', 'IN', 'SR', '600001', 13.0827, 80.2707, 'Asia/Kolkata', true, true, 'High', NOW(), NOW()),
('city_pune', 'Pune', 'PUN', 'Maharashtra', 'MH', 'India', 'IN', 'WR', '411001', 18.5204, 73.8567, 'Asia/Kolkata', true, true, 'Medium', NOW(), NOW()),
('city_kolkata', 'Kolkata', 'KOL', 'West Bengal', 'WB', 'India', 'IN', 'ER', '700001', 22.5726, 88.3639, 'Asia/Kolkata', true, true, 'Medium', NOW(), NOW()),
('city_ahmedabad', 'Ahmedabad', 'AMD', 'Gujarat', 'GJ', 'India', 'IN', 'WR', '380001', 23.0225, 72.5714, 'Asia/Kolkata', true, true, 'Medium', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    "isOperational" = EXCLUDED."isOperational",
    "marketPotential" = EXCLUDED."marketPotential",
    "updatedAt" = NOW();

-- Insert Hubs
-- Insert Hubs
INSERT INTO hubs (id, "cityId", name, code, address, "pinCode", latitude, longitude, "vehicleCapacity", "chargingPoints", "serviceCapacity", "operatingHours", status, "managerName", "contactNumber", "emailAddress", "hasParking", "hasChargingStation", "hasServiceCenter", "createdAt", "updatedAt") VALUES
-- Mumbai Hubs
('hub_mumbai_central', 'city_mumbai', 'Mumbai Central Hub', 'MUM-CNT', 'Plot No. 15, Central Mumbai, Near Railway Station', '400008', 19.0633, 72.8322, 500, 20, 50, '6:00 AM - 10:00 PM', 'Active', 'Rajesh Kumar', '+91-9876543210', 'mumbai.central@ev91.com', true, true, true, NOW(), NOW()),
('hub_mumbai_andheri', 'city_mumbai', 'Andheri Hub', 'MUM-AND', 'Andheri East, Near Metro Station', '400069', 19.1136, 72.8697, 300, 15, 30, '6:00 AM - 10:00 PM', 'Active', 'Priya Sharma', '+91-9876543211', 'mumbai.andheri@ev91.com', true, true, true, NOW(), NOW()),

-- Delhi Hubs
('hub_delhi_cp', 'city_delhi', 'Connaught Place Hub', 'DEL-CP', 'Connaught Place, Central Delhi', '110001', 28.6328, 77.2197, 400, 18, 40, '6:00 AM - 10:00 PM', 'Active', 'Amit Singh', '+91-9876543212', 'delhi.cp@ev91.com', true, true, true, NOW(), NOW()),
('hub_delhi_gurgaon', 'city_delhi', 'Gurgaon Hub', 'DEL-GUR', 'Sector 21, Gurgaon', '122015', 28.4595, 77.0266, 350, 12, 35, '6:00 AM - 10:00 PM', 'Active', 'Neha Gupta', '+91-9876543213', 'delhi.gurgaon@ev91.com', true, true, true, NOW(), NOW()),

-- Bangalore Hubs
('hub_bangalore_koramangala', 'city_bangalore', 'Koramangala Hub', 'BLR-KOR', 'Koramangala 4th Block, Bangalore', '560034', 12.9352, 77.6245, 450, 25, 45, '6:00 AM - 10:00 PM', 'Active', 'Suresh Reddy', '+91-9876543214', 'bangalore.koramangala@ev91.com', true, true, true, NOW(), NOW()),
('hub_bangalore_whitefield', 'city_bangalore', 'Whitefield Hub', 'BLR-WHI', 'Whitefield, ITPL Road', '560066', 12.9698, 77.7500, 300, 10, 25, '6:00 AM - 10:00 PM', 'Active', 'Kavitha Nair', '+91-9876543215', 'bangalore.whitefield@ev91.com', true, true, true, NOW(), NOW()),

-- Hyderabad Hubs
('hub_hyderabad_hitech', 'city_hyderabad', 'Hi-Tech City Hub', 'HYD-HTC', 'Hi-Tech City, Madhapur', '500081', 17.4485, 78.3908, 350, 16, 35, '6:00 AM - 10:00 PM', 'Active', 'Ravi Kumar', '+91-9876543216', 'hyderabad.hitech@ev91.com', true, true, true, NOW(), NOW()),

-- Chennai Hubs
('hub_chennai_omr', 'city_chennai', 'OMR Hub', 'CHE-OMR', 'Old Mahabalipuram Road, Chennai', '600096', 12.9172, 80.2392, 300, 12, 30, '6:00 AM - 10:00 PM', 'Active', 'Lakshmi Iyer', '+91-9876543217', 'chennai.omr@ev91.com', true, true, true, NOW(), NOW()),

-- Pune Hubs
('hub_pune_hinjewadi', 'city_pune', 'Hinjewadi Hub', 'PUN-HIN', 'Hinjewadi Phase 1, Pune', '411057', 18.5912, 73.7389, 250, 8, 25, '6:00 AM - 10:00 PM', 'Active', 'Manoj Patil', '+91-9876543218', 'pune.hinjewadi@ev91.com', true, true, true, NOW(), NOW()),

-- Kolkata Hubs
('hub_kolkata_salt_lake', 'city_kolkata', 'Salt Lake Hub', 'KOL-SLT', 'Salt Lake City, Sector 5', '700091', 22.5774, 88.4341, 200, 6, 20, '6:00 AM - 10:00 PM', 'Active', 'Sourav Das', '+91-9876543219', 'kolkata.saltlake@ev91.com', true, true, true, NOW(), NOW()),

-- Ahmedabad Hubs
('hub_ahmedabad_sg', 'city_ahmedabad', 'SG Highway Hub', 'AMD-SG', 'SG Highway, Ahmedabad', '380015', 23.0733, 72.5371, 200, 5, 20, '6:00 AM - 10:00 PM', 'Active', 'Kiran Patel', '+91-9876543220', 'ahmedabad.sg@ev91.com', true, true, true, NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = EXCLUDED.status,
    "managerName" = EXCLUDED."managerName",
    "contactNumber" = EXCLUDED."contactNumber",
    "emailAddress" = EXCLUDED."emailAddress",
    "updatedAt" = NOW();

-- Create a default hub for vehicles that don't have a specific assignment
INSERT INTO hubs (id, "cityId", name, code, address, "pinCode", latitude, longitude, "vehicleCapacity", "chargingPoints", "serviceCapacity", "operatingHours", status, "managerName", "contactNumber", "emailAddress", "hasParking", "hasChargingStation", "hasServiceCenter", "createdAt", "updatedAt") VALUES
('hub_default', 'city_mumbai', 'Default Hub', 'DEF-HUB', 'Default Hub Location', '400001', 19.0760, 72.8777, 1000, 50, 100, '24/7', 'Active', 'Admin', '+91-1234567890', 'admin@ev91.com', true, true, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update existing vehicles to assign them to the default hub if they don't have a hubId
-- This ensures data integrity while preserving existing vehicle data
UPDATE vehicles 
SET "hubId" = 'hub_default', "updatedAt" = NOW()
WHERE "hubId" IS NULL;
