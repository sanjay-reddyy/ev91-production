import { Router } from "express";
import { UnifiedServiceController } from "../controllers/UnifiedServiceController";

const router = Router();

// Service Request Management
router.post("/requests", UnifiedServiceController.createServiceRequest);
router.get("/requests", UnifiedServiceController.getServiceRequests);
router.get("/requests/:id", UnifiedServiceController.getServiceRequestById);
router.put("/requests/:id", UnifiedServiceController.updateServiceRequest);

// Service Request Actions
router.post("/requests/:id/approval", UnifiedServiceController.processApproval);

// Parts Management
router.post("/requests/:id/parts", UnifiedServiceController.addPartsRequest);
router.post(
  "/requests/:id/parts/usage",
  UnifiedServiceController.recordPartsUsage
);

// Analytics and Reporting
router.get("/analytics", UnifiedServiceController.getAnalytics);

export default router;
