import { Server } from "http";
import app from "./app";
import config from "./config";
import { initializeSubscriptionCronJobs } from './app/utils/subscriptionCronJobs';

const port = config.port || 8601;

async function main() {
  const server: Server = app.listen(port, () => {
    console.log("🚀 MADARA Server is running on port", port);
  });

  // Initialize subscription cron jobs
  initializeSubscriptionCronJobs();
  console.log("✅ Subscription cron jobs initialized");
  
  // Graceful shutdown
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("🛑 Server closed");
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: unknown) => {
    console.error("💥 Unexpected error:", error);
    exitHandler();
  };

  process.on("uncaughtException", unexpectedErrorHandler);
  process.on("unhandledRejection", unexpectedErrorHandler);
  process.on("SIGTERM", () => {
    console.log("🔄 SIGTERM received");
    if (server) {
      server.close();
    }
  });
}

main();
