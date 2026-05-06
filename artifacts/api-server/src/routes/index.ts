import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import catalogRouter from "./catalog.js";
import lawyersRouter from "./lawyers.js";
import articlesRouter from "./articles.js";
import newsletterRouter from "./newsletter.js";
import leadsRouter from "./leads.js";
import adminLeadsRouter from "./admin/leads.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(catalogRouter);
router.use(lawyersRouter);
router.use(articlesRouter);
router.use(newsletterRouter);
router.use(leadsRouter);
router.use(adminLeadsRouter);

export default router;
