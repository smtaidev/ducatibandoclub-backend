import z from "zod";

export const createNewsSchema = z.object({
    title: z.string(),
    link: z.string(),
    published: z.string(),
    source: z.string(),
    content: z.string()
})