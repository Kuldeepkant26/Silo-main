import { z } from "zod";

export const createOrganizationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});

export const editOrganizationSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
});
