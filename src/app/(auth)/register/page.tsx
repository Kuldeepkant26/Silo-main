import { Suspense } from "react";

import { UserRegistrationFlow } from "~/components/user-registration-flow";

export default function RegisterPage() {
  return (
    <Suspense>
      <UserRegistrationFlow />
    </Suspense>
  );
}
