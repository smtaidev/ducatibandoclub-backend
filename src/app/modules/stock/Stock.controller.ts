import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import httpStatus from "http-status";
import { StockServices } from "./Stock.service";
import { scheduleAllStockMarketData } from "../../utils/scheduleAllData";

const getStockSuggestions = catchAsync(async (req: Request, res: Response) => {
    // const result = await StockServices.getStockSuggestions();

    // const result = await scheduleAllStockMarketData();

    // const marketNews = await StockServices.getMaketNewsSuggestions()
    // const sectors = await StockServices.getSectorsDataSuggestions();
    // const topStocks = await StockServices.getTopStocksSuggestions()
    // const sectorStock = await StockServices.getSectorsStocksSuggestions();


    // const mergedData = {
    //     marketNews,
    //     sectors,
    //     topStocks,
    //     sectorStock
    // }

    const stockSuggestions = await StockServices.allSuggestStocks();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "Stock Suggestions Successfully",
        data: stockSuggestions
    })
})

export const StockControllers = {
    getStockSuggestions
}