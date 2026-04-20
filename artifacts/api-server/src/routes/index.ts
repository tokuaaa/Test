import { Router, type IRouter } from "express";
import healthRouter from "./health";
import festivalRouter from "./festival";

const router: IRouter = Router();

router.use(healthRouter);
router.use(festivalRouter);

export default router;
