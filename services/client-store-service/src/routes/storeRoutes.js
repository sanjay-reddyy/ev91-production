"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var storeController_1 = require("../controllers/storeController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Public routes (with basic auth)
router.get('/', storeController_1.getStores);
router.get('/stats', storeController_1.getStoreStats);
router.get('/client/:clientId', storeController_1.getStoresByClient);
router.get('/city/:cityId', storeController_1.getStoresByCity);
router.get('/:id', storeController_1.getStoreById);
// Protected routes (require specific roles)
router.post('/', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin']), storeController_1.createStore);
router.put('/:id', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin']), storeController_1.updateStore);
router.delete('/:id', (0, auth_1.requireRole)(['admin', 'super_admin']), storeController_1.deleteStore);
exports.default = router;
