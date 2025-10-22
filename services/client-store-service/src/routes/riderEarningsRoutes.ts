import express from "express";
import {
  listEarnings,
  getEarning,
  getEarningsByRider,
  getEarningsByStore,
  createEarning,
  updateEarning,
  deleteEarning,
  weeklySummary,
} from "../controllers/riderEarningsController";

const router = express.Router();

router.get("/", listEarnings);
router.get("/:id", getEarning);
router.get("/rider/:riderId", getEarningsByRider);
router.get("/store/:storeId", getEarningsByStore);
router.post("/", createEarning);
router.put("/:id", updateEarning);
router.delete("/:id", deleteEarning);
router.get("/weekly/:riderId", weeklySummary);

export default router;
