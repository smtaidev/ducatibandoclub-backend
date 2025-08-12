import { Router } from "express";
import { NewsControllers } from "./News.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createNewsSchema } from "./News.validation";

const router = Router();

router.get('/news', NewsControllers.getAllNews);
router.get('/top/:categoryName', NewsControllers.getTopStockesByCategory)

export const NewsRoutes = router; 