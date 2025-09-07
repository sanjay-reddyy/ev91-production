import { Router } from "express";
import { TeamController } from "../controllers/teamController";
import {
  authenticateEmployee,
  requirePermission,
} from "../middleware/employeeAuth";

const router = Router();
const teamController = new TeamController();

// All team routes require authentication with employee context
router.use(authenticateEmployee);

// GET /api/v1/teams - List teams
router.get("/", teamController.getAllTeams.bind(teamController));

// GET /api/v1/teams/:id - Get team by ID
router.get("/:id", teamController.getTeamById.bind(teamController));

// POST /api/v1/teams - Create team
router.post(
  "/",
  requirePermission("auth", "teams", "create"),
  TeamController.createTeamValidation,
  teamController.createTeam.bind(teamController)
);

// PUT /api/v1/teams/:id - Update team
router.put(
  "/:id",
  requirePermission("auth", "teams", "update"),
  TeamController.updateTeamValidation,
  teamController.updateTeam.bind(teamController)
);

// DELETE /api/v1/teams/:id - Delete team
router.delete(
  "/:id",
  requirePermission("auth", "teams", "delete"),
  teamController.deleteTeam.bind(teamController)
);

export default router;
