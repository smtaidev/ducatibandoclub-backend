import { Router } from "express";
import { StockControllers } from "./Stock.controller";

const router = Router();

router.post('/suggestions', StockControllers.getStockSuggestions)

export const StockRoutes = router;
