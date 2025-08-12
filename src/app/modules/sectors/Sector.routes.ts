import { Router } from "express";
import { SectorControllers } from "./Sector.controller";

const router = Router();

router.get("/", SectorControllers.getAllSectors)
// router.get("/:sector/stocks", SectorControllers.getSectorStocks)
router.get("/:sector/stocks", SectorControllers.getSectorStocksByParams)

export const SectorRoutes = router;
