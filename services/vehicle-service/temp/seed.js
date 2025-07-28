"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedOEMsAndModels = seedOEMsAndModels;
var client_1 = require("@prisma/client");
var prisma = new client_1.PrismaClient();
function seedOEMsAndModels() {
    return __awaiter(this, void 0, void 0, function () {
        var oemsData, oems, _i, oemsData_1, oemData, oem, modelsData, _loop_1, _a, modelsData_1, modelData;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🌱 Seeding OEMs and Vehicle Models...');
                    oemsData = [
                        {
                            name: 'Honda',
                            displayName: 'Honda Motor Co.',
                            code: 'HON',
                            country: 'Japan',
                            website: 'https://www.honda.com',
                            isActive: true,
                            isPreferred: true
                        },
                        {
                            name: 'Bajaj',
                            displayName: 'Bajaj Auto Limited',
                            code: 'BAJ',
                            country: 'India',
                            website: 'https://www.bajajauto.com',
                            isActive: true,
                            isPreferred: true
                        },
                        {
                            name: 'TVS',
                            displayName: 'TVS Motor Company',
                            code: 'TVS',
                            country: 'India',
                            website: 'https://www.tvsmotor.com',
                            isActive: true,
                            isPreferred: true
                        },
                        {
                            name: 'Hero',
                            displayName: 'Hero MotoCorp',
                            code: 'HER',
                            country: 'India',
                            website: 'https://www.heromotocorp.com',
                            isActive: true,
                            isPreferred: true
                        },
                        {
                            name: 'Ather',
                            displayName: 'Ather Energy',
                            code: 'ATH',
                            country: 'India',
                            website: 'https://www.atherenergy.com',
                            isActive: true,
                            isPreferred: true
                        },
                        {
                            name: 'Ola Electric',
                            displayName: 'Ola Electric Mobility',
                            code: 'OLA',
                            country: 'India',
                            website: 'https://olaelectric.com',
                            isActive: true,
                            isPreferred: true
                        }
                    ];
                    oems = [];
                    _i = 0, oemsData_1 = oemsData;
                    _b.label = 1;
                case 1:
                    if (!(_i < oemsData_1.length)) return [3 /*break*/, 4];
                    oemData = oemsData_1[_i];
                    return [4 /*yield*/, prisma.oEM.upsert({
                            where: { name: oemData.name },
                            update: oemData,
                            create: oemData
                        })];
                case 2:
                    oem = _b.sent();
                    oems.push(oem);
                    console.log("\u2705 Created/Updated OEM: ".concat(oem.name));
                    _b.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    modelsData = [
                        // Honda Models
                        {
                            oemName: 'Honda',
                            name: 'Activa 6G',
                            displayName: 'Honda Activa 6G',
                            modelCode: 'ACT6G',
                            category: 'Scooter',
                            segment: 'Entry',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Petrol',
                            engineCapacity: '109.51cc',
                            maxSpeed: 83,
                            range: 60,
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        {
                            oemName: 'Honda',
                            name: 'Dio',
                            displayName: 'Honda Dio',
                            modelCode: 'DIO',
                            category: 'Scooter',
                            segment: 'Entry',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Petrol',
                            engineCapacity: '109.51cc',
                            maxSpeed: 83,
                            range: 60,
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: false
                        },
                        // Bajaj Models
                        {
                            oemName: 'Bajaj',
                            name: 'Pulsar 150',
                            displayName: 'Bajaj Pulsar 150',
                            modelCode: 'PUL150',
                            category: 'Motorcycle',
                            segment: 'Premium',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Petrol',
                            engineCapacity: '149.5cc',
                            maxSpeed: 120,
                            range: 50,
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        {
                            oemName: 'Bajaj',
                            name: 'Chetak Electric',
                            displayName: 'Bajaj Chetak Electric',
                            modelCode: 'CHETEK',
                            category: 'Scooter',
                            segment: 'Premium',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Electric',
                            batteryCapacity: '3.0kWh',
                            maxSpeed: 60,
                            range: 95,
                            chargingTime: '5 hours',
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        // TVS Models
                        {
                            oemName: 'TVS',
                            name: 'Jupiter',
                            displayName: 'TVS Jupiter',
                            modelCode: 'JUP',
                            category: 'Scooter',
                            segment: 'Entry',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Petrol',
                            engineCapacity: '109.7cc',
                            maxSpeed: 82,
                            range: 62,
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        {
                            oemName: 'TVS',
                            name: 'iQube Electric',
                            displayName: 'TVS iQube Electric',
                            modelCode: 'IQUBE',
                            category: 'Scooter',
                            segment: 'Premium',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Electric',
                            batteryCapacity: '4.56kWh',
                            maxSpeed: 78,
                            range: 140,
                            chargingTime: '4.5 hours',
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        // Hero Models
                        {
                            oemName: 'Hero',
                            name: 'Splendor Plus',
                            displayName: 'Hero Splendor Plus',
                            modelCode: 'SPL+',
                            category: 'Motorcycle',
                            segment: 'Entry',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Petrol',
                            engineCapacity: '97.2cc',
                            maxSpeed: 85,
                            range: 68,
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        // Ather Models
                        {
                            oemName: 'Ather',
                            name: '450X',
                            displayName: 'Ather 450X',
                            modelCode: '450X',
                            category: 'Scooter',
                            segment: 'Premium',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Electric',
                            batteryCapacity: '3.7kWh',
                            maxSpeed: 90,
                            range: 146,
                            chargingTime: '6.5 hours',
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        {
                            oemName: 'Ather',
                            name: '450 Plus',
                            displayName: 'Ather 450 Plus',
                            modelCode: '450+',
                            category: 'Scooter',
                            segment: 'Premium',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Electric',
                            batteryCapacity: '3.7kWh',
                            maxSpeed: 70,
                            range: 100,
                            chargingTime: '6.5 hours',
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: false
                        },
                        // Ola Electric Models
                        {
                            oemName: 'Ola Electric',
                            name: 'S1 Pro',
                            displayName: 'Ola S1 Pro',
                            modelCode: 'S1PRO',
                            category: 'Scooter',
                            segment: 'Premium',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Electric',
                            batteryCapacity: '4.0kWh',
                            maxSpeed: 115,
                            range: 181,
                            chargingTime: '6.5 hours',
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        },
                        {
                            oemName: 'Ola Electric',
                            name: 'S1',
                            displayName: 'Ola S1',
                            modelCode: 'S1',
                            category: 'Scooter',
                            segment: 'Standard',
                            vehicleType: '2-Wheeler',
                            fuelType: 'Electric',
                            batteryCapacity: '3.97kWh',
                            maxSpeed: 90,
                            range: 141,
                            chargingTime: '6.5 hours',
                            seatingCapacity: 2,
                            isActive: true,
                            isPopular: true
                        }
                    ];
                    _loop_1 = function (modelData) {
                        var oem, oemName, modelCreateData, existingModel, model;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    oem = oems.find(function (o) { return o.name === modelData.oemName; });
                                    if (!oem) {
                                        console.error("\u274C OEM not found: ".concat(modelData.oemName));
                                        return [2 /*return*/, "continue"];
                                    }
                                    oemName = modelData.oemName, modelCreateData = __rest(modelData, ["oemName"]);
                                    return [4 /*yield*/, prisma.vehicleModel.findFirst({
                                            where: {
                                                oemId: oem.id,
                                                modelCode: modelData.modelCode
                                            }
                                        })];
                                case 1:
                                    existingModel = _c.sent();
                                    model = void 0;
                                    if (!existingModel) return [3 /*break*/, 3];
                                    return [4 /*yield*/, prisma.vehicleModel.update({
                                            where: { id: existingModel.id },
                                            data: __assign(__assign({}, modelCreateData), { oemId: oem.id })
                                        })];
                                case 2:
                                    // Update existing model
                                    model = _c.sent();
                                    return [3 /*break*/, 5];
                                case 3: return [4 /*yield*/, prisma.vehicleModel.create({
                                        data: __assign(__assign({}, modelCreateData), { oemId: oem.id })
                                    })];
                                case 4:
                                    // Create new model
                                    model = _c.sent();
                                    _c.label = 5;
                                case 5:
                                    console.log("\u2705 Created/Updated Model: ".concat(oem.name, " ").concat(model.name));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    _a = 0, modelsData_1 = modelsData;
                    _b.label = 5;
                case 5:
                    if (!(_a < modelsData_1.length)) return [3 /*break*/, 8];
                    modelData = modelsData_1[_a];
                    return [5 /*yield**/, _loop_1(modelData)];
                case 6:
                    _b.sent();
                    _b.label = 7;
                case 7:
                    _a++;
                    return [3 /*break*/, 5];
                case 8:
                    console.log('🎉 Seeding completed successfully!');
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 5]);
                    console.log('🚀 Starting database seeding...');
                    return [4 /*yield*/, seedOEMsAndModels()];
                case 1:
                    _a.sent();
                    console.log('✅ Database seeding completed successfully!');
                    return [3 /*break*/, 5];
                case 2:
                    error_1 = _a.sent();
                    console.error('❌ Error during seeding:', error_1);
                    if (error_1 instanceof Error) {
                        console.error('Error message:', error_1.message);
                        console.error('Stack trace:', error_1.stack);
                    }
                    throw error_1;
                case 3: return [4 /*yield*/, prisma.$disconnect()];
                case 4:
                    _a.sent();
                    console.log('🔌 Database connection closed.');
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main().catch(function (error) {
        console.error(error);
        process.exit(1);
    });
}
