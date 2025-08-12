import z from "zod";

const createStoreSchema = z.object({
  body: z.object({
    businessName: z.string({
      required_error: "business name is required!",
    }),
    storeCategory: z.string({
      required_error: "business name is required!",
    }),
    address: z.string({
      required_error: "Address is required!",
    }),
    latitude: z.number({
      required_error: "Address is required!",
    }),
    longitude: z.number({
      required_error: "Address is required!",
    }),

  }),
});

export const StoreValidation = { createStoreSchema };
