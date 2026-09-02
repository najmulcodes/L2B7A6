import { Router } from "express";
import * as problemsController from "./problems.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authorize } from "../../middleware/authorize.middleware";
import { validate } from "../../middleware/validate.middleware";
import { createProblemSchema, updateProblemSchema, listProblemsQuerySchema, idParamSchema } from "./problems.validation";

const router = Router();

router.use(authenticate, authorize("COMPANY"));

router.post("/", validate({ body: createProblemSchema }), problemsController.create);
router.get("/", validate({ query: listProblemsQuerySchema }), problemsController.list);
router.get("/:id", validate({ params: idParamSchema }), problemsController.getById);
router.patch("/:id", validate({ params: idParamSchema, body: updateProblemSchema }), problemsController.update);
router.delete("/:id", validate({ params: idParamSchema }), problemsController.remove);

export default router;
