import prisma from "../lib/prisma";
import { StockControllers } from "../modules/stock/Stock.controller";
import { StockServices } from "../modules/stock/Stock.service";
import { getAllStockMarketData, scheduleAllStockMarketData } from "../utils/scheduleAllData";

const trackStockMarketTime = async () => {
    try {
        // Check if track stock time already stored
        const isTrackStockMarketTime = await prisma.stockMarketTime.findFirst();

        // If not, create one
        if (!isTrackStockMarketTime) {
            const createdTime = await prisma.stockMarketTime.create({
                data: {
                    trackingTime: new Date()
                }
            });

            // console.log("Track Time Created:", createdTime);
            // console.log("Calling Get Stock Market Data FN.");
            getAllStockMarketData();
            scheduleAllStockMarketData();
            const result = await StockServices.allSuggestStocks();
            console.log(result);
            // console.log("Ending Calling Get Stock Market Data FN.");


        } else {
            // console.log("Track Time Already Exists:", isTrackStockMarketTime);

            const currentTime = new Date();
            const existingTime = new Date(isTrackStockMarketTime.trackingTime); // ensure it's a Date
            const diffTime = currentTime.getTime() - existingTime.getTime(); // difference in milliseconds
            const diffInDays = diffTime / (1000 * 60 * 60 * 24); // convert to days
            // if (diffInDays >= 7) {
            //     console.log("7 days or more have passed.");
            // } else {
            //     console.log("Less than 7 days have passed.");
            // }

            console.log("Time Difference (ms):", diffTime);

            const diffInMinutes = diffTime / (1000 * 60); // convert to minutes
            if (diffInMinutes >= 1) {
                // trackStockMarketTime();
                // console.log("1 minute or more has passed.");
                const result = await prisma.stockMarketTime.deleteMany();
                if (!result) {
                    throw new Error("Stock Market Checking time doesn't deleted successfully.")
                }
                console.log("Stock Market Tracking Time deleted.")
                scheduleAllStockMarketData();
                trackStockMarketTime();
            }
            else {
                console.log("Less than 1 minute has passed.");
            }

        }

    } catch (error) {
        console.error("Error tracking stock market time:", error);
    }
}

export default trackStockMarketTime;
