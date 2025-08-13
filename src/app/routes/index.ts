import express from "express";

import { AuthRouters } from "../modules/auth/auth.routes";
import { UsersRoutes } from "../modules/Users/Users.route";
import { NewsRoutes } from "../modules/news/News.routes";
import { SectorRoutes } from "../modules/sectors/Sector.routes";
import { StockRoutes } from "../modules/stock/Stock.routes";
import { StrategyRoutes } from "../modules/strategy/strategy.router";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/users",
    route: UsersRoutes,
  },
  {
    path: '/market',
    route: NewsRoutes
  },
  {
    path: '/sectors',
    route: SectorRoutes
  },
  {
    path: '/stocks',
    route: StockRoutes
  },
  {
    path: '/strategy',
    route: StrategyRoutes
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
