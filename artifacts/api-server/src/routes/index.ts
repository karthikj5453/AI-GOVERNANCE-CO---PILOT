import { Router, type IRouter } from "express";
import healthRouter from "./health";
import complaintsRouter from "./complaints";
import dashboardRouter from "./dashboard";
import documentsRouter from "./documents";
import speechRouter from "./speech";
import alertsRouter from "./alerts";
import boothsRouter from "./booths";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/complaints", complaintsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/files", documentsRouter);
router.use("/speech", speechRouter);
router.use("/alerts", alertsRouter);
router.use("/booth", boothsRouter);

export default router;
