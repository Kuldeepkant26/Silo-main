import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import z from "zod";

import { member, team, teamMembers } from "~/server/db/schema";

import { createTRPCRouter, organizationProtectedProcedure } from "../trpc";

export const teamRouter = createTRPCRouter({
  create: organizationProtectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(1, { message: "Name is required" })
          .max(256, { message: "Team name is too long" }),
        memberIds: z.array(z.string()).optional(),
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

      return await ctx.db.transaction(async (tx) => {
        const [newTeam] = await tx
          .insert(team)
          .values({
            name: input.name,
            organizationId,
          })
          .returning();

        if (!newTeam) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create team.",
          });
        }

        if (input.memberIds?.length) {
          const existingMembers = await tx
            .select()
            .from(member)
            .where(
              and(
                inArray(member.id, input.memberIds),
                eq(member.organizationId, organizationId),
              ),
            );

          if (existingMembers.length !== input.memberIds.length) {
            const foundMemberIds = existingMembers.map((m) => m.id);
            const missingMemberIds = input.memberIds.filter(
              (id) => !foundMemberIds.includes(id),
            );

            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid member IDs: ${missingMemberIds.join(", ")}`,
            });
          }

          const teamMembersData = input.memberIds.map((memberId) => ({
            teamId: newTeam.id,
            memberId,
          }));

          try {
            const insertedMembers = await tx
              .insert(teamMembers)
              .values(teamMembersData)
              .returning();

            if (!insertedMembers) {
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Failed to add members.",
              });
            }
          } catch (error) {
            throw error;
          }
        }

        return newTeam;
      });
    }),

  delete: organizationProtectedProcedure
    .input(z.object({ teamId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      if (!organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not belong to an organization.",
        });
      }

      const [teamToDelete] = await ctx.db
        .select()
        .from(team)
        .where(
          and(
            eq(team.id, input.teamId),
            eq(team.organizationId, organizationId),
          ),
        );

      if (!teamToDelete) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found or unauthorized.",
        });
      }

      const [deletedTeam] = await ctx.db
        .delete(team)
        .where(eq(team.id, input.teamId))
        .returning();

      return deletedTeam;
    }),

  edit: organizationProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z
          .string()
          .min(1, { message: "Name is required" })
          .max(256, { message: "Team name is too long" }),
        memberIds: z.array(z.string()).optional(),
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

      return await ctx.db.transaction(async (tx) => {
        const [existingTeam] = await tx
          .select()
          .from(team)
          .where(
            and(eq(team.id, input.id), eq(team.organizationId, organizationId)),
          );

        if (!existingTeam) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Team not found or unauthorized.",
          });
        }
           
        await tx
          .update(team)
          .set({
            name: input.name,
            updatedAt: new Date(),
          })
          .where(eq(team.id, input.id));

        if (input.memberIds !== undefined) {
          const existingMembers = await tx
            .select()
            .from(member)
            .where(
              and(
                inArray(member.id, input.memberIds),
                eq(member.organizationId, organizationId),
              ),
            );

          if (existingMembers.length !== input.memberIds.length) {
            const foundMemberIds = existingMembers.map((m) => m.id);
            const missingMemberIds = input.memberIds.filter(
              (id) => !foundMemberIds.includes(id),
            );
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invalid member IDs: ${missingMemberIds.join(", ")}`,
            });
          }

          await tx.delete(teamMembers).where(eq(teamMembers.teamId, input.id));

          if (input.memberIds.length > 0) {
            const newTeamMembers = input.memberIds.map((memberId) => ({
              teamId: input.id,
              memberId: memberId,
            }));
            await tx.insert(teamMembers).values(newTeamMembers);
          }
        }

        return { success: true, team: { ...existingTeam, name: input.name } };
      });
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

      return await ctx.db.query.team.findMany({
        where: eq(team.organizationId, organizationId),
        with: {
          teamMembers: {
            with: {
              member: {
                with: {
                  user: true,
                },
              },
            },
          },
        },
      });
    },
  ),

  getById: organizationProtectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      const teamData = await ctx.db.query.team.findFirst({
        where: eq(team.id, input.id),
      });

      if (!teamData)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Team not found",
        });

      if (teamData.organizationId !== organizationId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not belong to the team's organization",
        });

      return teamData;
    }),
});
