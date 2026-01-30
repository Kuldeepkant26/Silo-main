import { z } from "zod";

export const inviteToOrganizationSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "member", "owner", "legal"]).optional(),
});

export const editMemberSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  role: z.enum(["admin", "member", "owner", "legal"]),
  teams: z.array(z.string().uuid()).optional(),
});
