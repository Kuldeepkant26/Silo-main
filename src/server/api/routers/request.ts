import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { createRequestTRPCSchema } from "~/lib/validators/request";
import {
  createTRPCRouter,
  organizationProtectedProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";
import { requests, attachments as schemaAttchments } from "~/server/db/schema";

const decodeBase64ToBuffer = (base64String: string): Buffer => {
  if (!base64String || typeof base64String !== "string") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid Base64 string: provided value is not a string.",
    });
  }
  const parts = base64String.split(",");
  const base64Data = parts.length > 1 ? parts[1] : parts[0];

  if (!base64Data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Invalid Base64 string format: missing data part or empty string.",
    });
  }

  try {
    return Buffer.from(base64Data, "base64");
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Failed to decode Base64 string. Ensure it's valid Base64 data.",
      cause: error,
    });
  }
};

export const requestRouter = createTRPCRouter({
  create: organizationProtectedProcedure
    .input(createRequestTRPCSchema)
    .mutation(async ({ ctx, input }) => {
      const { summary, description, startDate, dueDate, attachments } = input;

      const activeOrganizationId = ctx.session.session.activeOrganizationId;
      const userId = ctx.session.user.id;

      const newRequest = await db.transaction(async (tx) => {
        const [request] = await tx
          .insert(requests)
          .values({
            summary,
            description,
            startDate,
            dueDate,
            organizationId: activeOrganizationId!,
            userId,
          })
          .returning();

        if (!request) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create request.",
          });
        }

        if (attachments && attachments.length > 0) {
          const attachmentRecords = [];
          for (const file of attachments) {
            if (
              !file.name ||
              !file.type ||
              !file.size ||
              !file.base64 ||
              typeof file.name !== "string" ||
              typeof file.type !== "string" ||
              typeof file.base64 !== "string" ||
              typeof file.size !== "number" ||
              file.size <= 0
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message:
                  "One or more attachment files are invalid or have missing/incorrect fields.",
              });
            }

            const { name: fileName, type: fileType, size: fileSize } = file;
            const fileContent = decodeBase64ToBuffer(file.base64);

            attachmentRecords.push({
              requestId: request.id,
              fileName,
              fileType,
              fileSize,
              fileContent,
            });
          }

          if (attachmentRecords.length > 0) {
            try {
              await tx.insert(schemaAttchments).values(attachmentRecords);
            } catch (error) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to save attachments.",
                cause: error,
              });
            }
          }
        }

        return request;
      });

      return newRequest;
    }),

  getByCompany: organizationProtectedProcedure.query(async ({ ctx }) => {
    const activeOrganizationId = ctx.session.session.activeOrganizationId;

    if (!activeOrganizationId || typeof activeOrganizationId !== "string") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Active organization ID is missing or invalid.",
      });
    }

    const organizationRequests = await db.query.requests.findMany({
      where: eq(requests.organizationId, activeOrganizationId),
      with: {
        attachments: true,
        user: true,
        organization: true,
      },
      orderBy: (requests, { desc }) => [desc(requests.createdAt)],
    });

    return organizationRequests;
  }),

  getById: organizationProtectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { id } = input;

      const request = await db.query.requests.findFirst({
        where: eq(requests.id, id),
        with: {
          attachments: true,
        },
      });

      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Request not found.",
        });
      }

      return request;
    }),
});
