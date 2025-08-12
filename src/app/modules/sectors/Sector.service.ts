import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../lib/prisma";
import { config } from "dotenv";
import { any } from "zod";

// Get All Sectors Service
const getAllSectors1 = async () => {
    try {
        const response = await fetch('http://172.252.13.69:8010/sectors');

        if (!response.ok) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Sectors data doesn't retrived successfully.")
        }

        const data = await response.json();

        return data;
    } catch (error) {
        console.error(error);

        throw error;
    }
}

const getAllSectors = async () => {
    try {
        const response = await fetch('http://172.252.13.69:8010/sectors');

        if (!response.ok) {
            console.warn('Failed to fetch sectors. Status:', response.status);
            return []; // Return empty array instead of throwing
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            console.warn('Sector data is empty or invalid.');
            return [];
        }

        return data;
    } catch (error) {
        console.error('Error fetching sector data:', error);
        return []; // Prevent server crash — return default safe value
    }
};



// Get Sector Stocks
const getSectorStocks1 = async (sector: string) => {
    try {
        // console.log("Get Sector Stocks Data for ", sector);
        // const response = await fetch(`http://172.252.13.69:8010/sectors/${sector}/stocks`);

        // const data = await response.json();
        // console.log(data);

        const allSectors = [
            "Basic Materials",
            "Communication Services",
            "Consumer Cyclical",
            "Consumer Defensive",
            "Energy",
            "Financial Services",
            "Healthcare",
            "Industrials",
            "Real Estate",
            "Technology",
            "Utilities"]

        const result = await Promise.all(
            allSectors.map(async (sectorName: string) => {
                const response = await fetch(`http://172.252.13.69:8010/sectors/${sectorName}/stocks`);

                if (!response.ok) {
                    throw new ApiError(httpStatus.BAD_REQUEST, "Sectors data doesn't retrived successfully.")
                }
                const data = await response.json();
                return data
            }
            )
        );

        return result;
        // return "Hello"
    } catch (error) {
        console.error(error);

        throw error;
    }
}

const getSectorStocks2 = async () => {
    try {
        const allSectors = [
            "Basic Materials",
            "Communication Services",
            "Consumer Cyclical",
            "Consumer Defensive",
            "Energy",
            "Financial Services",
            "Healthcare",
            "Industrials",
            "Real Estate",
            "Technology",
            "Utilities"
        ];

        const result = await Promise.all(
            allSectors.map(async (sectorName: string) => {
                const response = await fetch(`http://172.252.13.69:8010/sectors/${sectorName}/stocks`);

                if (!response.ok) {
                    throw new ApiError(httpStatus.BAD_REQUEST, `Failed to fetch stocks for ${sectorName}`);
                }

                const data = await response.json();
                return {
                    sector: sectorName,
                    stocks: data,
                };
            })
        );

        return result;
    } catch (error) {
        console.error("Error fetching sector stocks:", error);
        throw error;
    }
};


const getSectorStocks = async (sector: string) => {
    try {
        const allSectors = [
            "Basic Materials",
            "Communication Services",
            "Consumer Cyclical",
            "Consumer Defensive",
            "Energy",
            "Financial Services",
            "Healthcare",
            "Industrials",
            "Real Estate",
            "Technology",
            "Utilities"
        ];
        console.log("Get Sectors Stocks.")

        const result = await Promise.all(
            allSectors.map(async (sectorName: string) => {
                try {
                    const response = await fetch(`http://172.252.13.69:8010/sectors/${sectorName}/stocks`);

                    if (!response.ok) {
                        console.warn(`Failed to fetch stocks for ${sectorName}. Skipping...`);
                        return {
                            sector: sectorName,
                            stocks: [],
                            status: 'failed',
                        };
                    }

                    const data = await response.json();

                    console.log(data);

                    // Check for empty data
                    if (!data || data.length === 0) {
                        console.warn(`No stocks data for ${sectorName}.`);
                        return {
                            sector: sectorName,
                            stocks: [],
                            status: 'empty',
                        };
                    }

                    return {
                        sector: sectorName,
                        stocks: data,
                        status: 'success',
                    };
                } catch (innerError) {
                    console.error(`Error fetching data for ${sectorName}:`, innerError);
                    return {
                        sector: sectorName,
                        stocks: [],
                        status: 'error',
                    };
                }
            })
        );

        return result;
    } catch (error) {
        console.error("General error in getSectorStocks:", error);
        throw error;
    }
};

const getSectorStocksByParams1 = async (sector: string, bodyData: any) => {
    try {
        console.log("Get Sectors Stocks by using params.", sector);
        console.log("Body Data: ", bodyData)
        console.log("Body Sector: ", bodyData.sector);
        console.log("Body Stocks: ", bodyData.stocks);

        // if(bodyData) {
        //     throw new Error("Body data not found")
        // }

        // const response = await fetch(`http://172.252.13.69:8010/sectors/${sector}/stocks`);

        // First check if the response failed
        // if (!response.ok) {
        //     const errorData = await response.json().catch(() => ({})); // Try to get error details
        //     console.warn(`Failed to fetch stocks for ${sector}. Status: ${response.status}`, errorData);
        //     return {
        //         sector: sector,
        //         stocks: [],
        //         status: 'failed',
        //         error: `HTTP Error ${response.status}`,
        //         details: errorData
        //     };
        // }

        // const responseData = await response.json();

        // Validate the response data structure if needed
        // if (!responseData || typeof responseData !== 'object') {
        //     throw new Error(`Invalid response data format for sector ${sector}`);
        // }

        // data: {
        //     sector: body.sector,
        //     stocks: {
        //         create: body.stocks, 
        //     },
        // },
        // const bodyData = {
        //     sector: sector,
        //     stocks: body.stocks
        // }

        // const result = await prisma.sectorStock.create({
        //     data: { ...bodyData }
        // });
        // const result = await prisma.sectorStock.create({
        //     data: bodyData
        // });

        const result = await prisma.sectorStock.create({
            data: {
                sector: bodyData.sector,
                stocks: {
                    create: bodyData.stocks, // Correct usage
                },
            },
        });



        return result;

    } catch (error) {
        console.error(`Error in getSectorStocks for ${sector}:`, error);

        // Return a consistent error response structure
        return {
            sector: sector,
            stocks: [],
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            ...(error instanceof Error && { stack: error.stack })
        };
    }
};

interface StockInput {
    ticker: string;
    name: string;
    symbol: string;
    // Add other stock properties as needed
}

interface SectorStockInput {
    sector: string;
    stocks: StockInput[];
}

const getSectorStocksByParams = async (sector: string, bodyData: SectorStockInput) => {
    try {
        // Validate required fields
        if (!bodyData?.stocks || !Array.isArray(bodyData.stocks)) {
            throw new Error('Stocks data is required and must be an array');
        }

        // Use the sector from params if bodyData.sector is not provided
        const targetSector = bodyData.sector || sector;

        const result = await prisma.sectorStock.create({
            data: {
                sector: targetSector,
                stocks: {
                    create: bodyData.stocks.map(stock => ({
                        ticker: stock.ticker,
                        name: stock.name,
                        symbol: stock.symbol
                        // Include other required stock fields here
                    })),
                },
            },
            include: {
                stocks: {
                    select: {
                        id: false, // Explicitly exclude id if you don't want it
                        ticker: true,
                        name: true,
                        symbol: true,
                        // Include other fields you want in the response
                    }
                }
            }
        });

        return result;

    } catch (error) {
        console.error(`Error in getSectorStocks for ${sector}:`, error);

        // For Prisma errors, you might want to sanitize the error message
        const errorMessage = error instanceof Error ?
            (error.message.includes('prisma') ? 'Database operation failed' : error.message)
            : 'Unknown error';

        return {
            sector: sector,
            stocks: [],
            status: 'error',
            error: errorMessage,
            ...(error instanceof Error && process.env.NODE_ENV === 'development' && { stack: error.stack })
        };
    }
};



export const SectorServices = {
    getAllSectors,
    getSectorStocks,
    getSectorStocksByParams
} 