import { Router } from "express";
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  getClientsByCity,
  getClientStats,
  getAccountManagers,
} from "../controllers/clientController";
import { requireRole, requireTeamAccess } from "../middleware/auth";

const router = Router();

// Public routes (with basic auth)
router.get("/", getClients);
router.get("/stats", getClientStats);
router.get("/account-managers", getAccountManagers);
router.get("/city/:city", getClientsByCity);
router.get("/:id", getClientById);

// Protected routes (require specific roles)
router.post(
  "/",
  requireRole(["Admin", "Super Admin", "Manager"]),
  createClient
);
router.put(
  "/:id",
  requireRole(["Admin", "Super Admin", "Manager"]),
  updateClient
);
router.delete("/:id", requireRole(["Admin", "Super Admin"]), deleteClient);

export default router;
