import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import z from "zod";

import type { MemberWithTeams } from "~/server/db/schema";
import { member, user } from "~/server/db/auth";
import { team, teamMembers } from "~/server/db/schema";

import { createTRPCRouter, organizationProtectedProcedure } from "../trpc";

export const memberRouter = createTRPCRouter({
  getCurrentUserRole: organizationProtectedProcedure.query(async ({ ctx }) => {
    const activeOrganizationId = ctx.session.session.activeOrganizationId;
    const userId = ctx.session.user.id;

    const currentMember = await ctx.db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, activeOrganizationId!),
      ),
      columns: { role: true },
    });

    return {
      role: currentMember?.role ?? "member",
      isAdmin: currentMember?.role === "admin" || currentMember?.role === "owner",
      isOwner: currentMember?.role === "owner",
      isMember: currentMember?.role === "member",
      isLegal: currentMember?.role === "legal",
    };
  }),

  edit: organizationProtectedProcedure
    .input(
      z.object({
        id: z.string(),
        role: z.enum(["admin", "member", "owner", "legal"]),
        teams: z.array(z.string().uuid()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, role, teams } = input;
      const db = ctx.db;

      const memberUpdated = await db
        .update(member)
        .set({ role })
        .where(eq(member.id, id));

      if (teams) {
        const currentTeams = await db
          .select({
            teamId: teamMembers.teamId,
          })
          .from(teamMembers)
          .where(eq(teamMembers.memberId, id));

        const currentTeamIds = new Set(currentTeams.map((t) => t.teamId));
        const newTeamIds = new Set(teams);

        const teamsToRemove = [...currentTeamIds].filter(
          (teamId) => !newTeamIds.has(teamId),
        );

        const teamsToAdd = [...newTeamIds].filter(
          (teamId) => !currentTeamIds.has(teamId),
        );

        if (teamsToRemove.length > 0) {
          await db
            .delete(teamMembers)
            .where(
              and(
                eq(teamMembers.memberId, id),
                inArray(teamMembers.teamId, teamsToRemove),
              ),
            );
        }
        if (teamsToAdd.length > 0) {
          await db.insert(teamMembers).values(
            teamsToAdd.map((teamId) => ({
              memberId: id,
              teamId,
            })),
          );
        }
      }

      return memberUpdated;
    }),

  getAllByOrganization: organizationProtectedProcedure.query(
    async ({ ctx }) => {
      const activeOrganizationId = ctx.session.session.activeOrganizationId;

      const results = await ctx.db
        .select({
          member: member,
          user: user,
          team: team,
        })
        .from(member)
        .leftJoin(user, eq(member.userId, user.id))
        .leftJoin(teamMembers, eq(member.id, teamMembers.memberId))
        .leftJoin(team, eq(teamMembers.teamId, team.id))
        .where(eq(member.organizationId, activeOrganizationId!));

      const membersMap = new Map<string, MemberWithTeams>();

      for (const row of results) {
        if (!membersMap.has(row.member.id)) {
          membersMap.set(row.member.id, {
            ...row.member,
            user: row.user,
            teams: [],
          });
        }

        const memberData = membersMap.get(row.member.id);
        if (memberData && row.team) {
          memberData.teams.push(row.team);
        }
      }
      return Array.from(membersMap.values());
    },
  ),

  getById: organizationProtectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const organizationId = ctx.session.session.activeOrganizationId;

      const memberData = await ctx.db.query.member.findFirst({
        where: eq(member.id, input.id),
      });

      if (!memberData)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Member not found",
        });

      if (memberData.organizationId !== organizationId)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "User does not belong to the member's organization",
        });

      return memberData;
    }),
});

