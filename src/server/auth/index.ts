import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { oAuthProxy, organization } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { Resend } from "resend";

import { ForgotPasswordEmail } from "~/components/emails/forgot-password";
import { InviteUserEmail } from "~/components/emails/invite-user";
import { INVITATION_ID_QUERY_PARAM } from "~/config/shared";
import { env } from "~/env";

import { db } from "../db";
import { member } from "../db/auth";

const resend = new Resend(env.RESEND_API_KEY);

export const config = {
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day (session will be updated if it's older than this)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const userMembership = await db.query.member.findFirst({
            where: eq(member.userId, session.userId),
            columns: {
              organizationId: true,
            },
          });

          return {
            data: {
              ...session,
              activeOrganizationId: userMembership?.organizationId ?? null,
            },
          };
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
        to: user.email,
        subject: "Reset your password",
        react: ForgotPasswordEmail({ user, resetUrl: url }),
      });
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    oAuthProxy(),
    organization({
      async sendInvitationEmail(data) {
        const inviteLink = `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/register?${INVITATION_ID_QUERY_PARAM}=${data.invitation.id}`;

        await resend.emails.send({
          from: `${process.env.EMAIL_SENDER_NAME} <${process.env.EMAIL_SENDER_ADDRESS}>`,
          to: data.email,
          subject: `Join ${data.organization.name} in Silo`,
          react: InviteUserEmail({ data, inviteLink }),
        });
      },
    }),
    nextCookies(),
  ],
  secret: env.AUTH_SECRET,
  socialProviders: {},
  trustedOrigins: [
    "http://localhost:3000",
    "https://silo-psi.vercel.app",
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth(config);

export type Session = typeof auth.$Infer.Session & {
  user?: (typeof auth.$Infer.Session)["user"];
};
export type AuthUserType = Session["user"];
