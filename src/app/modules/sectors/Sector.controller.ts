import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../helpers/sendResponse";
import httpStatus from "http-status";
import { SectorServices } from "./Sector.service";

// Get All Sectors data
// const getAllSectors = catchAsync(async (req: Request, res: Response) => {
//     // const result = await SectorServices.getAllSectors();
//      const result: string[] = await SectorServices.getAllSectors();

//     // console.log(result);

//     // result.map((cat: string) => console.log(cat));
//     // result.forEach((cat: string) => console.log(cat));
//     result.forEach( async (sector: string) => SectorServices.getSectorStocks(sector));

//     sendResponse(res, {
//         statusCode: httpStatus.OK,
//         message: "All Sectors Retrived successfully",
//         data: result
//     })
// })

const getAllSectors = catchAsync(async (req: Request, res: Response) => {
    const result: string[] = await SectorServices.getAllSectors();

    // const sectorStockData = await Promise.all(
    //     result.map(async (sector: string) => {
    //         const stocks = await SectorServices.getSectorStocks(sector);
    //         return { sector, stocks };
    //     })
    // );

    // console.log(sectorStockData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "All sectors and their stocks retrieved successfully",
        // data: sectorStockData
        data: result
    });
});


// Get Sector Stocks
const getSectorStocks = catchAsync(async (req: Request, res: Response) => {
    const sector = req.params.sector;
    const result = await SectorServices.getSectorStocks(sector);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "All Sectors Stocks Retrived successfully",
        data: result
    })
})

// Get Sector Stocks By Params
const getSectorStocksByParams = catchAsync(async (req: Request, res: Response) => {
    const sector = req.params.sector;
    const bodyData = req.body;
    const result = await SectorServices.getSectorStocksByParams(sector, bodyData);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "All Sectors Stocks Retrived successfully",
        data: result
    })
})


export const SectorControllers = {
    getAllSectors,
    getSectorStocks,
    getSectorStocksByParams
}