import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  addOrderItem,
  updateOrderItem,
  deleteOrderItem,
  addOrderPayment,
  getOrdersByRiderId,
  getOrdersByClientId,
  getOrdersByStoreId,
  getOrderStats,
} from "../controllers/orderController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// Public routes (with basic auth)
router.get("/", authenticate, getOrders);
router.get("/stats", authenticate, getOrderStats);
router.get("/rider/:riderId", authenticate, getOrdersByRiderId);
router.get("/client/:clientId", authenticate, getOrdersByClientId);
router.get("/store/:storeId", authenticate, getOrdersByStoreId);
router.get("/:id", authenticate, getOrderById);

// Protected routes (require authentication and specific roles)
router.post(
  "/",
  authenticate,
  requireRole(["Admin", "Super Admin", "Manager"]),
  createOrder
);

router.put(
  "/:id",
  authenticate,
  requireRole(["Admin", "Super Admin", "Manager"]),
  updateOrder
);

router.patch("/:id/status", authenticate, updateOrderStatus);

// Order items routes
router.post("/:id/items", authenticate, addOrderItem);

router.put("/:id/items/:itemId", authenticate, updateOrderItem);

router.delete("/:id/items/:itemId", authenticate, deleteOrderItem);

// Payment routes
router.post("/:id/payments", authenticate, addOrderPayment);

export default router;
