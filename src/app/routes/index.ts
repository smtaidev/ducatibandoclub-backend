import express from "express";

import { AuthRouters } from "../modules/auth/auth.routes";
import { AuthLoginRoutes } from "../modules/auth-login/auth-login.routes";
import { UsersRoutes } from "../modules/Users/Users.route";
import { NewsRoutes } from "../modules/news/News.routes";
import { SectorRoutes } from "../modules/sectors/Sector.routes";
import { StockRoutes } from "../modules/stock/Stock.routes";
import { StrategyRoutes } from "../modules/strategy/strategy.router";
import { SubscriptionRoutes } from "../modules/subscription/subscription.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/auth-login",
    route: AuthLoginRoutes,
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
  {
    path: '/subscription',
    route: SubscriptionRoutes
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
