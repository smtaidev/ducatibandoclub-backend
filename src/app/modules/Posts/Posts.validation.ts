import { StoreCategory } from "@prisma/client";
import z from "zod";

const createPostSchema = z.object({
  body: z.object({
    productName: z.string({
      required_error: "Product name is required!",
    }),
    brandName: z.string().optional(),
    description: z.string().optional(),
    category: z.nativeEnum(StoreCategory).refine(
      (val) => Object.values(StoreCategory).includes(val),
      (val) => ({
        message: `Invalid category value: '${val}', expected one of [${Object.values(StoreCategory).join(", ")}]`,
      })
    ),
    distance: z.number({
      required_error: "Distance is required!",
    }),
    address: z.string({
      required_error: "Address is required!",
    }),
    latitude: z.number({
      required_error: "Latitude is required!",
    }),
    longitude: z.number({
      required_error: "Longitude is required!",
    }),

  }),
});

export const PostValidation = { createPostSchema };
