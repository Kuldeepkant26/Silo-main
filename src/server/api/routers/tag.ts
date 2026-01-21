import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import z from "zod";

import { tag } from "~/server/db/schema";

import { createTRPCRouter, organizationProtectedProcedure } from "../trpc";

export const tagRouter = createTRPCRouter({
  create: organizationProtectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Tag name is required").max(256),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not belong to an organization.",
        });
      }

      const [newTag] = await ctx.db
        .insert(tag)
        .values({ name: input.name, organizationId })
        .returning();

      return newTag;
    }),

  delete: organizationProtectedProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid tag ID"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.delete(tag).where(eq(tag.id, input.id)).returning();
    }),

  edit: organizationProtectedProcedure
    .input(
      z.object({
        id: z.string().uuid("Invalid tag ID"),
        name: z.string().min(1).max(256).optional(),
        status: z.enum(["active", "inactive"]).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .update(tag)
        .set({
          name: input.name,
          status: input.status,
        })
        .where(eq(tag.id, input.id))
        .returning();
    }),

  getAllByOrganization: organizationProtectedProcedure.query(
    async ({ ctx }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not belong to an organization.",
        });
      }

      return await ctx.db.query.tag.findMany({
        where: eq(tag.organizationId, organizationId),
      });
    },
  ),

  getById: organizationProtectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      const tagData = await ctx.db.query.tag.findFirst({
        where: eq(tag.id, input.id),
      });

      if (!tagData) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tag not found.",
        });
      }

      if (tagData.organizationId !== organizationId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not belong to the same tag's organization",
        });
      }

      return tagData;
    }),
});
