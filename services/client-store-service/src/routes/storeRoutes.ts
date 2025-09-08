import { Router } from "express";
import {
  createStore,
  getStores,
  getStoreById,
  updateStore,
  deleteStore,
  getStoresByClient,
  getStoresByCity,
  getStoreStats,
} from "../controllers/storeController";
import { requireRole, requireTeamAccess } from "../middleware/auth";

const router = Router();

// Public routes (with basic auth)
router.get("/", getStores);
router.get("/stats", getStoreStats);
router.get("/client/:clientId", getStoresByClient);
router.get("/city/:cityId", getStoresByCity);
router.get("/:id", getStoreById);

// Protected routes (require specific roles)
router.post("/", requireRole(["Admin", "Super Admin", "Manager"]), createStore);
router.put(
  "/:id",
  requireRole(["Admin", "Super Admin", "Manager"]),
  updateStore
);
router.delete("/:id", requireRole(["Admin", "Super Admin"]), deleteStore);

export default router;
