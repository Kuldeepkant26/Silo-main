import type { inferProcedureOutput } from "@trpc/server";
import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { customType, pgTableCreator, uuid } from "drizzle-orm/pg-core";

import type { AppRouter } from "../api/root";
import { member, organization, user } from "./auth";

// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => name);

const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
  dataType() {
    return "bytea";
  },
});

export type Team = InferSelectModel<typeof team>;
export type TeamWithMembers = inferProcedureOutput<
  AppRouter["team"]["getAllByOrganization"]
>[number];
export type Request = InferSelectModel<typeof requests>;
export type Tag = InferSelectModel<typeof tag>;
export type Attachment = InferSelectModel<typeof attachments>;
export type MemberWithTeams = typeof member.$inferSelect & {
  user: typeof user.$inferSelect | null;
  teams: (typeof team.$inferSelect)[];
};

export const requests = createTable("request", (t) => ({
  id: uuid().defaultRandom().primaryKey(),
  summary: t.varchar({ length: 256 }).notNull(),
  description: t.text().notNull(),
  startDate: t.timestamp("start_date", { withTimezone: true }),
  dueDate: t.timestamp("due_date", { withTimezone: true }),
  organizationId: t
    .text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: t
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date()),
}));

export const attachments = createTable("attachment", (t) => ({
  id: t.uuid("id").defaultRandom().primaryKey(),
  requestId: t
    .uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  fileName: t.varchar("file_name", { length: 256 }).notNull(),
  fileType: t.varchar("file_type", { length: 100 }).notNull(),
  fileSize: t.integer("file_size").notNull(),
  fileContent: bytea("file_content").notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const team = createTable("team", (t) => ({
  id: uuid().defaultRandom().primaryKey(),
  name: t.varchar("name", { length: 256 }).notNull(),
  organizationId: t
    .text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date()),
}));

export const teamMembers = createTable("team_members", (t) => ({
  id: uuid().defaultRandom().primaryKey(),
  teamId: t
    .uuid("team_id")
    .notNull()
    .references(() => team.id, { onDelete: "cascade" }),
  memberId: t
    .text("member_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date()),
}));

export const tag = createTable("tag", (t) => ({
  id: uuid("id").defaultRandom().primaryKey(),
  name: t.varchar("name", { length: 256 }).notNull().unique(),
  organizationId: t
    .text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  status: t
    .text("status")
    .$type<"active" | "inactive">()
    .default("active")
    .notNull(),
  createdAt: t
    .timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: t
    .timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date()),
}));

export const requestToTags = createTable("request_to_tags", (t) => ({
  requestId: t
    .uuid("request_id")
    .notNull()
    .references(() => requests.id, { onDelete: "cascade" }),
  tagId: t
    .uuid("tag_id")
    .notNull()
    .references(() => tag.id, { onDelete: "cascade" }),
}));

/* -- RELATIONS -- */

export const organizationToRequestsRelations = relations(
  organization,
  ({ many }) => ({
    requests: many(requests),
  }),
);

export const requestsRelations = relations(requests, ({ one, many }) => ({
  attachments: many(attachments),
  requestToTags: many(requestToTags),
  organization: one(organization, {
    fields: [requests.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [requests.userId],
    references: [user.id],
  }),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  request: one(requests, {
    fields: [attachments.requestId],
    references: [requests.id],
  }),
}));

export const memberRelations = relations(member, ({ one, many }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  teamMembers: many(teamMembers),
}));

export const teamRelations = relations(team, ({ one, many }) => ({
  organization: one(organization, {
    fields: [team.organizationId],
    references: [organization.id],
  }),
  teamMembers: many(teamMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(team, {
    fields: [teamMembers.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [teamMembers.memberId],
    references: [member.id],
  }),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  requestToTags: many(requestToTags),
}));

export const requestToTagsRelations = relations(requestToTags, ({ one }) => ({
  tag: one(tag, {
    fields: [requestToTags.tagId],
    references: [tag.id],
  }),
  request: one(requests, {
    fields: [requestToTags.requestId],
    references: [requests.id],
  }),
}));

export * from "./auth";
