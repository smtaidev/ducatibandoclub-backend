import sendResponse from "../../helpers/sendResponse";
import prisma from "../../lib/prisma";
import { scheduleAllStockMarketData } from "../../utils/scheduleAllData";

const getStockSuggestions = async () => {
    // const result = scheduleAllStockMarketData();
    const result = await prisma.marketNews.findMany({});

    return result;
}

// All Market News
const getMaketNewsSuggestions = async () => {
    const result = await prisma.marketNews.findMany({});

    return result;
}

// All Sectors Data
const getSectorsDataSuggestions = async () => {
    const result = await prisma.sectors.findMany({});

    return result;
}

// All Top Stock Data
const getTopStocksSuggestions = async () => {
    const result = await prisma.stockCategory.findMany({});

    return result;
}

// All Sectors Stocks
const getSectorsStocksSuggestions = async () => {
    const result = await prisma.sectorStock.findMany({});

    return result;
}

const allSuggestStocks = async () => {
    const marketNews = await getMaketNewsSuggestions()
    const sectors = await getSectorsDataSuggestions();
    const topStocks = await getTopStocksSuggestions()
    const sectorStock = await getSectorsStocksSuggestions();


    const mergedData = {
        marketNews,
        sectors,
        topStocks,
        sectorStock
    }
    const result = await fetch(`http://172.252.13.69:8010/stocks/suggestions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mergedData)
    });

    if (!result.ok) {
        throw new Error("Failed to send suggestions data");
    }

    const data = await result.json();
    return data;
}

export const StockServices = {
    getStockSuggestions,
    getMaketNewsSuggestions,
    getSectorsDataSuggestions,
    getTopStocksSuggestions,
    getSectorsStocksSuggestions,
    allSuggestStocks
}
