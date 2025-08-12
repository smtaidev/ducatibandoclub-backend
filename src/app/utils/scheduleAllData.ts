// For Schefuling
import cron from 'node-cron';
import { NewsServices } from '../modules/news/News.service';
import { NewsControllers } from '../modules/news/News.controller';
import { SectorControllers } from '../modules/sectors/Sector.controller';
import { SectorServices } from '../modules/sectors/Sector.service';
import trackStockMarketTime from '../trackStockMarketTime';
import prisma from '../lib/prisma';

export const scheduleAllStockMarketData = () => {
  cron.schedule('* * * * *', async () => {
    // const newsData = await NewsServices.getAllNews();
    try {
      const newsData = await NewsServices.getAllNews();
      const sectorsData = await SectorServices.getAllSectors();
      const topStocksData = await NewsServices.getTopStockesByCategory('');
      const sectorsStocksData = await SectorServices.getSectorStocks('');
      // console.log("Sectors Stock Data Length: Line: 18", sectorsStocksData.length);

      // Stored news Data
      if (newsData.length > 0) {
        const storedMarketNews = await prisma.marketNews.findFirst();
        if (storedMarketNews) {
          const deleteStoredMarketNews = await prisma.marketNews.deleteMany();
          if (deleteStoredMarketNews) {
            console.log('All Stored Market News data deleted.');
          }
        }

        const result = await prisma.marketNews.create({
          data: newsData,
        });

        if (result) {
          console.log('Stock Market News Data created successfully.');
        }
      }

      // Stored Sectors Data
      if (sectorsData.length > 0) {
        const sectors = await prisma.sectors.findFirst();
        if (sectors) {
          const deleteSectors = await prisma.sectors.deleteMany();
          if (deleteSectors) {
            console.log('All sectors data deleted.');
          }
        }

        const formattedSectors = sectorsData.map((sectorsName) => ({ sectorsName }));

        const result = await prisma.sectors.createMany({
          data: formattedSectors,
        });
        if (result) {
          console.log('Sectors Data created successfully.');
        }
      }

      // Top Stocks Data
      if (topStocksData.length > 0) {
        const result = await prisma.$transaction(async (tx) => {
          await tx.stockCategory.deleteMany();

          const createdCategories = [];

          for (const item of topStocksData) {
            const dij50 = await tx.dij50.create({
              data: {
                additionalProp1: item.dij50.last_price,
                additionalProp2: item.dij50.change,
                additionalProp3: item.dij50.change_percent,
              },
            });

            const stockCategory = await tx.stockCategory.create({
              data: {
                category: item.category,
                last_updated: item.last_updated,
                dij50Id: dij50.id,
                stocks: item.stocks,
              },
            });

            createdCategories.push(stockCategory);
          }

          return createdCategories;
        });

        console.log('All Stock Categories and Dij50 records created:', result);
      }

      // Sectors Stocks Data
      if (sectorsStocksData.length > 0) {
        const sectorStockResult = await prisma.sectorStock.findFirst();
        if (sectorStockResult) {
          const deleteSectorsStock = await prisma.sectorStock.deleteMany();
          if (deleteSectorsStock) {
            console.log('All sectors stock data deleted.');
          }
        }

        const result = await prisma.sectorStock.createMany({
          data: sectorsStocksData,
        });

        if (result) {
          console.log('Sectors Stock Data created successfully.');
        }
      }

      // Debug log
      // console.log("Top Stocks Data:", JSON.stringify(topStocksData, null, 2));
      // console.log(newsData);
      // console.log(sectorsData);
      // console.log("All News data retrived successfully.")

      const mergedData = {
        news: newsData,
        sectors: sectorsData,
        topStocksData: topStocksData,
        sectorsStocksData: sectorsStocksData,
      };

      // console.log(mergedData);
      // console.log("All stock market data retrieved successfully.");
      return { input_data: mergedData };
    } catch (error: any) {
      console.error('Error fetching news data:', error);
      throw error('All stock market data retrieved successfully.');
    }
  });
};

export const getAllStockMarketData = async () => {
  try {
    const newsData = await NewsServices.getAllNews();
    const sectorsData = await SectorServices.getAllSectors();
    const topStocksData = await NewsServices.getTopStockesByCategory('');
    const sectorsStocksData = await SectorServices.getSectorStocks('');

    // console.log("Sectors Stock Data Length: Line: 148", sectorsStocksData.length);
    // console.log("Line number: 149");

    // Debug log
    // console.log("Top Stocks Data:", JSON.stringify(topStocksData, null, 2));
    // console.log(newsData);
    // console.log(sectorsData);
    // console.log("All News data retrived successfully.")

    // Stored News Data
    if (newsData.length > 0) {
      const storedMarketNews = await prisma.marketNews.findFirst();
      if (storedMarketNews) {
        const deleteStoredMarketNews = await prisma.marketNews.deleteMany();
        if (deleteStoredMarketNews) {
          console.log('All Stored Market News data deleted.');
        }
      }

      const result = await prisma.marketNews.createMany({
        data: newsData,
      });

      if (result) {
        console.log('Stock Market News Data created successfully.');
      }
    }

    // Stored Sectors Data
    if (sectorsData.length > 0) {
      const sectors = await prisma.sectors.findFirst();
      if (sectors) {
        const deleteSectors = await prisma.sectors.deleteMany();
        if (deleteSectors) {
          console.log('All sectors data deleted.');
        }
      }

      const formattedSectors = sectorsData.map((sectorsName) => ({ sectorsName }));

      const result = await prisma.sectors.createMany({
        data: formattedSectors,
      });
      if (result) {
        console.log('Sectors Data created successfully.');
      }
    }

    // Top Stocks Data
    // if (topStocksData.length > 0) {

    //     const result = await prisma.$transaction(async (tx) => {
    //         await tx.stockCategory.deleteMany();

    //         const createdCategories = [];

    //         for (const item of topStocksData) {
    //             const dij50 = await tx.dij50.create({
    //                 data: {
    //                     additionalProp1: item.dij50.last_price,
    //                     additionalProp2: item.dij50.change,
    //                     additionalProp3: item.dij50.change_percent
    //                 },
    //             });

    //             const stockCategory = await tx.stockCategory.create({
    //                 data: {
    //                     category: item.category,
    //                     last_updated: item.last_updated,
    //                     dij50Id: dij50.id,
    //                     stocks: item.stocks,
    //                 },
    //             });

    //             createdCategories.push(stockCategory);
    //         }

    //         return createdCategories;
    //     });

    //     // console.log("All Stock Categories and Dij50 records created:", result);
    // }

    // Top Stocks Data
    if (topStocksData.length > 0) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.stockCategory.deleteMany();

        const createdCategories = [];

        for (const item of topStocksData) {
          const dij50 = await tx.dij50.create({
            data: {
              additionalProp1: item.dij50.last_price,
              additionalProp2: item.dij50.change,
              additionalProp3: item.dij50.change_percent,
            },
          });

          const stockCategory = await tx.stockCategory.create({
            data: {
              category: item.category,
              last_updated: item.last_updated,
              dij50Id: dij50.id,
              stocks: item.stocks,
            },
          });

          createdCategories.push(stockCategory);
        }

        return createdCategories;
      });

      // console.log("All Stock Categories and Dij50 records created:", result);
    }

    // Sectors Stocks Data
    if (sectorsStocksData.length > 0) {
      const sectorStockResult = await prisma.sectorStock.findFirst();
      if (sectorStockResult) {
        const deleteSectorsStock = await prisma.sectorStock.deleteMany();
        if (deleteSectorsStock) {
          console.log('All sectors stock data deleted.');
        }
      }

      const result = await prisma.sectorStock.createMany({
        data: sectorsStocksData,
      });

      if (result) {
        console.log('Sectors Stock Data created successfully.');
      }
    }

    const mergedData = {
      news: newsData,
      sectors: sectorsData,
      topStocksData: topStocksData,
      sectorsStocksData: sectorsStocksData,
    };

    // console.log(mergedData);
    // console.log("All stock market data retrieved successfully.");
    return { input_data: mergedData };
  } catch (error) {
    console.error('Error fetching news data:', error);
  }
};

export const scheduleStockMarketTrackingTime = () => {
  cron.schedule('*/2 * * * *', async () => {
    try {
      trackStockMarketTime();
    } catch (error) {
      console.error('Error schedule stock market time tracking. ', error);
    }
  });
};
