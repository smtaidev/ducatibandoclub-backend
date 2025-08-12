import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import cron from 'node-cron';

// Get All News Service
const getAllNews = async () => {

    try {

        const response = await fetch('http://172.252.13.69:8010/market/news');

        if (!response.ok) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Data doesn't retrived successfully.")
        }

        const data = await response.json();
        // console.log(data);

        return data;

    } catch (error) {
        console.error(error);

        throw error;
    }

}

// Get Top Stockes
const getTopStockesByCategory1 = async (catogoryName: string) => {
    try {
        // console.log(catogoryName);
        // ['gainers', 'losers', 'most_active']

        const allCategories = ['gainers', 'losers', 'most_active'];

        // const response = await fetch(`http://172.252.13.69:8010/market/top/${catogoryName}`);

        // if (!response.ok) {
        //     throw new ApiError(httpStatus.BAD_REQUEST, "Data doesn't retrived successfully.")
        // }

        // const data = await response.json();


        const result = await Promise.all(
            allCategories.map(async (category: string) =>
            // NewsServices.getTopStockesByCategory(category)
            {
                const response = await fetch(`http://172.252.13.69:8010/market/top/${category}`)
                const data = await response.json();
                // console.log(category, " Data : ", data);
                return data
            }
            )
        );

        // Optionally merge results with category labels
        const categorizedResult = allCategories.map((category, index) => ({
            category,
            stocks: result[index],
        }));

        return categorizedResult;

    } catch (error) {
        console.error(error);

        throw error;
    }
}


const getTopStockesByCategory = async (catogoryName: string) => {
    try {

        const allCategories = ['gainers', 'losers', 'most_active'];

        const result = await Promise.all(
            allCategories.map(async (category: string) =>
            {
                const response = await fetch(`http://172.252.13.69:8010/market/top/${category}`)
                const data = await response.json();
                return data
            }
            )
        );

        // Optionally merge results with category labels
        // const categorizedResult = allCategories.map((category, index) => ({
        //     category,
        //     stocks: result[index],
        // }));

        // return categorizedResult;
        return result;

    } catch (error) {
        console.error(error);
        throw error;
    }
}

export const NewsServices = {
    getAllNews,
    getTopStockesByCategory
}


//    "Basic Materials",
//     "Communication Services",
//     "Consumer Cyclical",
//     "Consumer Defensive",
//     "Energy",
//     "Financial Services",
//     "Healthcare",
//     "Industrials",
//     "Real Estate",
//     "Technology",
//     "Utilities"
