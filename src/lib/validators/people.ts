import { z } from "zod";

export const inviteToOrganizationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "member", "owner"]).optional(),
});

export const editMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "member", "owner"]),
  teams: z.array(z.string().uuid()).optional(),
});
