import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import catalogRouter from "./catalog.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);

export default router;
