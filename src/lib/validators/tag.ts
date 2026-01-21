import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

export const editTagSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  status: z.enum(["active", "inactive"]).default("active").optional(),
});
