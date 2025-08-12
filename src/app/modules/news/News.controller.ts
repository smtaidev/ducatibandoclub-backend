import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { NewsServices } from "./News.service";
import sendResponse from "../../helpers/sendResponse";
import httpStatus from "http-status";
// // For Schefuling
// import cron from 'node-cron';

// export const scheduleGetAllNewsFetch = () => {
//    cron.schedule('* * * * *', async () => {
//     const newsData = await NewsServices.getAllNews();


//     console.log(newsData)
//    })
// }

// Get All news
const getAllNews = catchAsync(async (req: Request, res: Response) => {
    const result = await NewsServices.getAllNews();

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "All News Retrived Successfully",
        data: result
    })
})

// Get Top Stockes By Category
const getTopStockesByCategory = catchAsync(async (req: Request, res: Response) => {
    const categoryName = req.params.categoryName;

    const allCategories = ['gainers', 'losers', 'most_active'];
    // allCategories.map(async (category: string) => await NewsServices.getTopStockesByCategory(categoryName) )
    const result = await NewsServices.getTopStockesByCategory(categoryName);

    // const result = await Promise.all(
    //     allCategories.map((category: string) =>
    //         NewsServices.getTopStockesByCategory(category)
    //     )
    // );

    // // Optionally merge results with category labels
    // const categorizedResult = allCategories.map((category, index) => ({
    //     category,
    //     stocks: result[index],
    // }));

    sendResponse(res, {
        statusCode: httpStatus.OK,
        message: "Top Stockes Retrived Successfully",
        data: result
    })
})


export const NewsControllers = {
    getAllNews,
    getTopStockesByCategory
}