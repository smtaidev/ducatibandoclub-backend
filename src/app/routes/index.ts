import express from "express";

import { AuthRouters } from "../modules/auth/auth.routes";
import { UsersRoutes } from "../modules/Users/Users.route";


import { ChatRouters } from "../modules/chat/chat.route";
// import { PaymentRouters } from "../modules/payment/payment.routes";

import { ReviewRouters } from "../modules/review/review.routes";
import { NotificationsRouters } from "../modules/notifications/notification.routes";

import { StoreRouters } from "../modules/store/store.routes";
import { PostRouters } from "../modules/Posts/Posts.routes";
import { NewsRoutes } from "../modules/news/News.routes";
import path from "path";
import { SectorRoutes } from "../modules/sectors/Sector.routes";
import { StockRoutes } from "../modules/stock/Stock.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouters,
  },
  {
    path: "/stores",
    route: StoreRouters,
  },
  {
    path: "/users",
    route: UsersRoutes,
  },

  {
    path: "/posts",
    route: PostRouters,
  },
  {
    path: "/chats",
    route: ChatRouters
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

  // {
  //   path: "/payments",
  //   route: PaymentRouters
  // },
  {
    path: "/notifications",
    route: NotificationsRouters
  },
  {
    path: "/reviews",
    route: ReviewRouters
  },

];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
