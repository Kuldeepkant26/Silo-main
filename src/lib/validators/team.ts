import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  memberIds: z.array(z.string()).optional(),
});

export const editTeamSchema = z.object({
  name: z.string().min(1, { message: "Name is required " }),
  memberIds: z.array(z.string()).optional(),
});
