import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface OtpVerificationEmailProps {
  otp: string;
  email: string;
}

export function OtpVerificationEmail({ otp, email }: OtpVerificationEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />

        <Preview>Your Silo verification code: {otp}</Preview>

        <Body className="bg-gray-100 py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[8px] bg-white p-[40px] shadow-sm">
            <Section className="mb-[32px] text-center">
              <Heading className="m-0 mb-[8px] text-[28px] font-bold text-gray-900">
                Verify your email
              </Heading>
              <Text className="m-0 text-[16px] text-gray-600">
                Use the code below to verify <strong>{email}</strong>
              </Text>
            </Section>

            <Section className="mb-[32px] text-center">
              <div className="mx-auto inline-block rounded-[12px] bg-gray-50 px-[40px] py-[24px]">
                <Text className="m-0 font-mono text-[40px] font-bold tracking-[12px] text-gray-900">
                  {otp}
                </Text>
              </div>
            </Section>

            <Section className="mb-[24px]">
              <Text className="m-0 text-center text-[14px] leading-[20px] text-gray-500">
                This code expires in <strong>10 minutes</strong>. If you did not
                request this, please ignore this email.
              </Text>
            </Section>

            <Section className="border-t border-gray-200 pt-[24px]">
              <Text className="m-0 text-center text-[12px] text-gray-400">
                © {new Date().getFullYear()} Silo. All rights reserved.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
