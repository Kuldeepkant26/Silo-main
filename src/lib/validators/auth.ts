import * as z from "zod";

export const userAuthSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(64, "Password must not exceed 64 characters"),
});

export const userAuthSignUpSchema = userAuthSchema
  .extend({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters long")
      .max(64, "Name must not exceed 64 characters")
      .nonempty("Name cannot be empty"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters long")
      .max(64, "Confirm password must not exceed 64 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
