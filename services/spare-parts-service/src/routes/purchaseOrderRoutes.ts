import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { authMiddleware } from "../middleware/auth";

const router = Router();

import { purchaseOrderService } from "../services/PurchaseOrderService";

// Get all purchase orders (with filters, pagination)
router.get(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await purchaseOrderService.getPurchaseOrders(req.query);
    if (result && "data" in result && "pagination" in result) {
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } else {
      res.json({ success: true, data: result });
    }
  })
);

// Get purchase order by ID
router.get(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const orders = await purchaseOrderService.getPurchaseOrders({ id });
    const order = Array.isArray(orders.data) ? orders.data[0] : orders.data;
    if (!order)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: order });
  })
);

// Create purchase order
router.post(
  "/",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const createdBy = req.user?.id || "system";
    const po = await purchaseOrderService.createPurchaseOrder(
      req.body,
      createdBy
    );
    res.status(201).json({ success: true, data: po });
  })
);

// Update purchase order (status, terms, notes, etc)
router.patch(
  "/:id",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const po = await purchaseOrderService.updatePurchaseOrder(id, req.body);
    res.json({ success: true, data: po });
  })
);

// Receive items for a purchase order
router.post(
  "/:id/receive",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const receivedBy = req.user?.id || "system";
    const result = await purchaseOrderService.receiveItems(
      id,
      req.body.receivedItems,
      receivedBy
    );
    if (result && "data" in result && "pagination" in result) {
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } else {
      res.json({ success: true, data: result });
    }
  })
);

// Analytics: spend, supplier performance, order trends
router.get(
  "/analytics/spend",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await purchaseOrderService.getSpendAnalytics(req.query);
    res.json({ success: true, ...result }); // result is not expected to have 'success' here
  })
);
router.get(
  "/analytics/supplier/:supplierId",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { supplierId } = req.params;
    const result = await purchaseOrderService.getSupplierPerformance(
      supplierId
    );
    res.json({ success: true, ...result }); // result is not expected to have 'success' here
  })
);
router.get(
  "/analytics/trends",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await purchaseOrderService.getOrderTrends(req.query);
    res.json({ success: true, trends: result });
  })
);

// Reporting: overdue, pending, completed orders
router.get(
  "/reports/summary",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const result = await purchaseOrderService.getOrderReports();
    res.json({ success: true, ...result }); // result is not expected to have 'success' here
  })
);

export default router;
