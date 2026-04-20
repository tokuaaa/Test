import { Router, type IRouter } from "express";
import {
  getFestivalGroupsPayload,
  getFestivalSummary,
} from "../lib/festivalSheets";

const router: IRouter = Router();

router.get("/festival/groups", async (req, res): Promise<void> => {
  try {
    res.json(await getFestivalGroupsPayload());
  } catch (error) {
    req.log.error({ err: error }, "Failed to load festival groups");
    const message = error instanceof Error ? error.message : "Failed to load festival groups";
    res.status(502).json({ error: message });
  }
});

router.get("/festival/summary", async (req, res): Promise<void> => {
  try {
    res.json(await getFestivalSummary());
  } catch (error) {
    req.log.error({ err: error }, "Failed to load festival summary");
    const message = error instanceof Error ? error.message : "Failed to load festival summary";
    res.status(502).json({ error: message });
  }
});

export default router;