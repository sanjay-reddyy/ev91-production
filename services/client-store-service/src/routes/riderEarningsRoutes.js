"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var riderEarningsController_1 = require("../controllers/riderEarningsController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Public routes (with basic auth)
router.get('/', riderEarningsController_1.getRiderEarnings);
router.get('/rider/:riderId', riderEarningsController_1.getRiderEarningsByRider);
router.get('/store/:storeId', riderEarningsController_1.getRiderEarningsByStore);
router.get('/weekly/:riderId', riderEarningsController_1.getWeeklyRiderSummary);
router.get('/:id', riderEarningsController_1.getRiderEarningById);
// Protected routes (require specific roles)
router.post('/', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin', 'rider']), riderEarningsController_1.createRiderEarning);
router.put('/:id', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin']), riderEarningsController_1.updateRiderEarning);
router.delete('/:id', (0, auth_1.requireRole)(['admin', 'super_admin']), riderEarningsController_1.deleteRiderEarning);
// Report generation
router.post('/reports/weekly', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin']), riderEarningsController_1.generateWeeklyReport);
exports.default = router;
