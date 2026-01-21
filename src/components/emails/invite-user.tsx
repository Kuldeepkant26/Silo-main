import type {
  Invitation,
  Member,
  Organization,
} from "better-auth/plugins/organization";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface InviteUserEmailProps {
  data: {
    id: string;
    role: string;
    email: string;
    organization: Organization;
    invitation: Invitation;
    inviter: Member;
  };
  inviteLink: string;
}

export function InviteUserEmail({ data, inviteLink }: InviteUserEmailProps) {
  const { email, organization } = data;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />

        <Preview>
          You&apos;re invited to join {organization.name} on Silo!
        </Preview>

        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[40px] shadow-sm">
            <Section className="mb-[32px] text-center">
              <Heading className="m-0 mb-[8px] text-[28px] font-bold text-gray-900">
                You&apos;re Invited!
              </Heading>

              <Text className="m-0 text-[16px] text-gray-600">
                Join the team at {organization.name}
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="m-0 mb-[16px] text-[16px] leading-[24px] text-gray-700">
                Hello,
              </Text>

              <Text className="m-0 mb-[16px] text-[16px] leading-[24px] text-gray-700">
                You&apos;ve been invited by an administrator to join{" "}
                <strong>{organization.name}</strong> on Silo.
              </Text>

              <Text className="m-0 mb-[24px] text-[16px] leading-[24px] text-gray-700">
                Click the button below to accept your invitation and set up your
                account. This invitation is for {email}
              </Text>
            </Section>

            <Section className="mb-[32px] text-center">
              <Button
                href={inviteLink}
                className="box-border inline-block rounded-[8px] bg-blue-600 px-[32px] py-[16px] text-[16px] font-semibold text-white no-underline"
              >
                Accept Invitation
              </Button>
            </Section>

            <Section className="mb-[32px]">
              <Text className="m-0 mb-[8px] text-[14px] leading-[20px] text-gray-600">
                If the button doesn&apos;t work, copy and paste this link into
                your browser:
              </Text>

              <Link
                href={inviteLink}
                className="text-[14px] break-all text-blue-600"
              >
                {inviteLink}
              </Link>
            </Section>

            <Section className="mb-[32px] rounded-[8px] bg-gray-50 p-[20px]">
              <Text className="m-0 mb-[8px] text-[14px] leading-[20px] font-semibold text-gray-700">
                Security Notice:
              </Text>

              <Text className="m-0 mb-[8px] text-[14px] leading-[20px] text-gray-600">
                • If you didn&apos;t expect this invitation, please ignore this
                email.
              </Text>

              <Text className="m-0 text-[14px] leading-[20px] text-gray-600">
                • For security, never share this link with anyone.
              </Text>
            </Section>

            <Section className="mb-[32px]">
              <Text className="m-0 text-[14px] leading-[20px] text-gray-600">
                Need help? Contact our support team at{" "}
                <Link href="mailto:support@silo.com" className="text-blue-600">
                  support@silo.com
                </Link>
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="m-0 mb-[8px] text-[12px] leading-[16px] text-gray-500">
                This email was sent to {email}
              </Text>

              <Text className="m-0 mb-[8px] text-[12px] leading-[16px] text-gray-500">
                Silo, 123 Business Street, Sitges, Catalonia, Spain
              </Text>

              <Text className="m-0 text-[12px] leading-[16px] text-gray-500">
                © 2025 Silo. All rights reserved.{" "}
                <Link href="#" className="text-gray-500">
                  Unsubscribe
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
