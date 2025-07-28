"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var clientController_1 = require("../controllers/clientController");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
// Public routes (with basic auth)
router.get('/', clientController_1.getClients);
router.get('/stats', clientController_1.getClientStats);
router.get('/city/:city', clientController_1.getClientsByCity);
router.get('/:id', clientController_1.getClientById);
// Protected routes (require specific roles)
router.post('/', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin']), clientController_1.createClient);
router.put('/:id', (0, auth_1.requireRole)(['admin', 'super_admin', 'team_admin']), clientController_1.updateClient);
router.delete('/:id', (0, auth_1.requireRole)(['admin', 'super_admin']), clientController_1.deleteClient);
exports.default = router;
