import { z } from "zod";

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILES_COUNT = 5;
export const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
];

const base64Regex = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+)?;base64,.*/;

export const fileInputSchema = z
  .instanceof(File, { message: "Attachment must be a file." })
  .refine(
    (file) => file.size <= MAX_FILE_SIZE,
    `Max file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
  )
  .refine(
    (file) => ACCEPTED_FILE_TYPES.includes(file.type),
    "Unsupported file type.",
  );

export const filePayloadSchema = z.object({
  name: z.string().min(1, "File name is required."),
  type: z
    .string()
    .refine(
      (type) => ACCEPTED_FILE_TYPES.includes(type),
      "Unsupported file type.",
    ),
  size: z
    .number()
    .max(MAX_FILE_SIZE, `Max file size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`),
  base64: z
    .string()
    .regex(base64Regex, "Invalid Base64 format for file content."),
});

export const createRequestSchema = z
  .object({
    summary: z.string().min(1, { message: "Summary is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    startDate: z
      .date({
        invalid_type_error: "Start date must be a valid date.",
      })
      .optional(),
    dueDate: z
      .date({
        invalid_type_error: "Due date must be a valid date.",
      })
      .optional(),
    attachments: z
      .array(fileInputSchema)
      .max(MAX_FILES_COUNT, {
        message: `You can upload a maximum of ${MAX_FILES_COUNT} files.`,
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return data.dueDate > data.startDate;
      }
      return true;
    },
    {
      message: "Due date must be after start date",
      path: ["dueDate"],
    },
  );

export const createRequestTRPCSchema = z
  .object({
    summary: z.string().min(1, { message: "Summary is required" }),
    description: z.string().min(1, { message: "Description is required" }),
    startDate: z
      .date({
        invalid_type_error: "Start date must be a valid date.",
      })
      .optional(),
    dueDate: z
      .date({
        invalid_type_error: "Due date must be a valid date.",
      })
      .optional(),
    // Attachments here are validated as an array of objects containing the Base64 string
    attachments: z
      .array(filePayloadSchema)
      .max(MAX_FILES_COUNT, {
        message: `You can upload a maximum of ${MAX_FILES_COUNT} files.`,
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return data.dueDate > data.startDate;
      }
      return true;
    },
    {
      message: "Due date must be after start date",
      path: ["dueDate"],
    },
  );
