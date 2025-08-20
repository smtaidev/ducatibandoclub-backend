import cors from "cors";
import express, { Application, Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import morgan from "morgan";
import path from "path";
import bodyParser from "body-parser";
import globalErrorHandler from "./app/errors/globalErrorHandler";
import router from "./app/routes";
import { SubscriptionController } from "./app/modules/subscription/subscription.controller";

console.log("ba con ler cors ?>>>>>>>>>>>>>>");
import corsConfig from "./config/cors-config";

const app: Application = express();

// const corsOptions = {
//   origin: [
//     'http://localhost:3000',
//     'https://04e7b13bed3f.ngrok-free.app',
//     'https://ducatibandoclub-client.vercel.app',
//   ],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: [
//     'Origin',
//     'X-Requested-With',
//     'Content-Type',
//     'Accept',
//     'Authorization',
//     'Cache-Control',
//     'Pragma',
//     'Expires',
//     "Content-Type", 
//     "Authorization"
//   ],
//   preflightContinue: false,
//   optionsSuccessStatus: 200
// };

const authOptions = {
   origin: true,
   credentials: true,
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
 }

app.use(
  // corsConfig()
  cors(authOptions)
);


app.post(
  "/api/v1/subscription/webhook",
  bodyParser.raw({ type: "application/json" }),
  SubscriptionController.handleWebhook
);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serve
app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));

app.get("/", (req: Request, res: Response) => {
  res.send({ Message: "The madara server is running. . ." });
});

app.use(morgan("dev"));


app.use("/api/v1", router);

app.use(globalErrorHandler);

app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;













/*




// import cors from "cors";
// import express, { Application, NextFunction, Request, Response } from "express";
// import httpStatus from "http-status";
// import globalErrorHandler from "./app/errors/globalErrorHandler";
// import router from "./app/routes";
// import path from "path";
// import morgan from "morgan";



// const app: Application = express();


// app.use(
//   cors({
//     origin: [
//       "http://localhost:3000",
//       "",
//     ],
//   })
// );

// //parser - Apply raw body parser for webhooks first
// app.use('/api/v1/subscription/webhook', express.raw({ type: 'application/json' }));
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(__dirname, "..", "public", "uploads")));
// console.log(path.join(__dirname, "..", "public", "uploads"))

// app.get("/", (req: Request, res: Response) => {
//   res.send({
//     Message: "The madara server is running. . .",
//   });
// });

// app.use(morgan('dev'));
// app.use("/api/v1", router);

// app.use(globalErrorHandler);

// app.use((req: Request, res: Response, next: NextFunction) => {
//   res.status(httpStatus.NOT_FOUND).json({
//     success: false,
//     message: "API NOT FOUND!",
//     error: {
//       path: req.originalUrl,
//       message: "Your requested path is not found!",
//     },
//   });
// });

// export default app;
*/