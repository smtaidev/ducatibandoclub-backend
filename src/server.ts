import { Server } from "http";
import app from "./app";
import config from "./config";
import { getAllStockMarketData, scheduleAllStockMarketData, scheduleStockMarketTrackingTime } from "./app/utils/scheduleAllData";
import trackStockMarketTime from "./app/trackStockMarketTime";

const port = config.port || 8601;

async function main() {
  const server: Server = app.listen(port, () => {
    console.log("MADARA Server is running on port ", port);
  });

  // Track Stock market time
  // trackStockMarketTime();

  // Get All Stock Market Data When server was running
  // getAllStockMarketData();
}


// scheduleAllStockMarketData();

// Schedule Stock Market Tracking Time
// scheduleStockMarketTrackingTime();

main();
