import { z } from "zod";

export const SearchSchema = z.object({
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
});

export type SearchType = z.infer<typeof SearchSchema>;