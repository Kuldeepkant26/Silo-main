"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import {
  INVITATION_ID_QUERY_PARAM,
  SILO_INVITATION_ID_LS,
} from "~/config/shared";
import { ROUTES } from "~/constants/routes";
import { authClient } from "~/server/auth/client";
import { Logo } from "./logo";
import { Spinner } from "./spinner";

// Constants
const STEPS = {
  YOU: 1,
  SECURITY: 2,
};

export function UserRegistrationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Step management
  const [currentStep, setCurrentStep] = useState(STEPS.YOU);
  const [subStep, setSubStep] = useState(1);

  // Step 1: User Info
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  // Step 2: Security
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Handle invitation ID from URL
  useEffect(() => {
    const invitationId = searchParams.get(INVITATION_ID_QUERY_PARAM);
    if (invitationId) localStorage.setItem(SILO_INVITATION_ID_LS, invitationId);
    else localStorage.removeItem(SILO_INVITATION_ID_LS);
  }, [searchParams]);

  // Handle email from URL (coming from Get Started modal)
  useEffect(() => {
    const emailFromUrl = searchParams.get("email");
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [searchParams]);

  // Navigation helpers
  const goToNextStep = () => {
    if (currentStep < STEPS.SECURITY) {
      setCurrentStep(currentStep + 1);
      setSubStep(1);
    }
  };

  const goToNextSubStep = () => {
    setSubStep(subStep + 1);
  };

  const goToPreviousStep = () => {
    if (subStep > 1) {
      setSubStep(subStep - 1);
    } else if (currentStep > STEPS.YOU) {
      setCurrentStep(currentStep - 1);
      // Go to last substep of previous step
      if (currentStep - 1 === STEPS.YOU) setSubStep(1);
      else if (currentStep - 1 === STEPS.SECURITY) setSubStep(2);
    }
  };

  const goToPreviousSubStep = () => {
    if (subStep > 1) {
      setSubStep(subStep - 1);
    } else {
      goToPreviousStep();
    }
  };

  // Form handlers
  const handleUserInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && firstName && lastName) {
      goToNextStep();
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password && password.length >= 8) {
      goToNextSubStep();
    }
  };

  const handleConfirmPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmPassword !== password) {
      toast.error("Passwords don't match", {
        description: "Please make sure both passwords are identical",
      });
      return;
    }
    
    // Complete registration
    await handleCompleteRegistration();
  };

  const handleCompleteRegistration = async () => {
    setIsLoading(true);

    try {
      // Combine first and last name for API
      const fullName = `${firstName} ${lastName}`.trim();

      // Sign up the user (this also logs them in automatically)
      const signUpResult = await authClient.signUp.email({
        name: fullName,
        email,
        password,
      });

      if (signUpResult?.error) {
        toast.error(signUpResult.error.message ?? "Something went wrong", {
          description: "Please try again",
        });
        setIsLoading(false);
        return;
      }

      // Handle invitation if present
      const invitationId = localStorage.getItem(SILO_INVITATION_ID_LS);

      if (invitationId) {
        const { data } = await authClient.organization.getInvitation({
          query: { id: invitationId },
        });

        if (data?.email !== email) {
          toast.error("Email doesn't match invitation", {
            description: "Please use the email associated with the invitation",
          });
          await authClient.deleteUser({ callbackURL: ROUTES.REGISTER });
          setIsLoading(false);
          return;
        }

        const { error } = await authClient.organization.acceptInvitation({
          invitationId,
        });

        if (error) {
          toast.error("Failed to accept invitation", {
            description: error.message ?? "Please try again",
          });
          await authClient.deleteUser({ callbackURL: ROUTES.REGISTER });
          setIsLoading(false);
          return;
        }

        // Set the organization from the invitation as active so OrganizationGuard doesn't show
        if (data?.organizationId) {
          await authClient.organization.setActive({
            organizationId: data.organizationId,
          });
        }

        localStorage.removeItem(SILO_INVITATION_ID_LS);
        toast.success("Welcome!", {
          description: `You've joined ${data.organizationName}`,
        });
      } else {
        toast.success("Account created!", {
          description: "Welcome to Silo! Please create your organization.",
        });
      }

      setIsLoading(false);
      
      // Navigate to requests page with hard reload to ensure session is refreshed
      window.location.href = ROUTES.REQUESTS;
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again",
      });
      setIsLoading(false);
    }
  };

  // Render stepper
  const renderStepper = () => (
    <div className="flex items-center gap-2 sm:gap-3">
      <span className={`text-sm sm:text-base font-medium transition-colors ${currentStep === STEPS.YOU ? "text-foreground underline underline-offset-4" : currentStep > STEPS.YOU ? "text-muted-foreground" : "text-muted-foreground/60"}`}>
        You
      </span>
      <span className="text-muted-foreground">→</span>
      <span className={`text-sm sm:text-base font-medium transition-colors ${currentStep === STEPS.SECURITY ? "text-foreground underline underline-offset-4" : "text-muted-foreground/60"}`}>
        Security
      </span>
    </div>
  );

  // Illustrations
  const renderUserIllustration = () => (
    <div className="hidden md:flex h-80 w-80 items-center justify-center rounded-[20px]">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-44 w-44 text-foreground">
        <circle cx="50" cy="35" r="18" />
        <path d="M20 85c0-16.57 13.43-30 30-30s30 13.43 30 30" strokeLinecap="round" />
      </svg>
    </div>
  );

  const renderLockIllustration = () => (
    <div className="hidden md:flex h-80 w-80 items-center justify-center rounded-[20px]">
      <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-44 w-44 text-foreground">
        <rect x="25" y="45" width="50" height="40" rx="5" />
        <path d="M35 45V35c0-8.28 6.72-15 15-15s15 6.72 15 15v10" strokeLinecap="round" />
        <circle cx="50" cy="65" r="5" fill="currentColor" />
      </svg>
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    // Step 1: Tell us about you
    if (currentStep === STEPS.YOU) {
      return (
        <>
          <div className="flex-1 max-w-[520px] w-full md:pl-10">
            <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-semibold text-foreground mb-2.5 tracking-tight leading-tight">
              Tell us about you
            </h1>

            <form onSubmit={handleUserInfoSubmit} className="flex flex-col gap-6 mt-6">
              <div className="flex flex-col gap-2.5">
                <label className="text-[15px] font-medium text-foreground">Email</label>
                <input
                  type="email"
                  className="w-full px-5 py-4 text-base text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all bg-background hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.06)]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                <div className="flex-1 flex flex-col gap-2.5">
                  <label className="text-[15px] font-medium text-foreground">First name</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 text-base text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all bg-background hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.06)]"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
                <div className="flex-1 flex flex-col gap-2.5">
                  <label className="text-[15px] font-medium text-foreground">Last name</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 text-base text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all bg-background hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.06)]"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder=""
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={!email || !firstName || !lastName}
                className="inline-flex items-center justify-center px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-primary-foreground bg-primary border-none rounded-full cursor-pointer transition-all w-fit mt-2.5 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
              >
                CONTINUE
              </button>
            </form>
          </div>
          {renderUserIllustration()}
        </>
      );
    }

    // Step 2: Security
    if (currentStep === STEPS.SECURITY) {
      // Sub-step 1: Set password
      if (subStep === 1) {
        return (
          <>
            <div className="flex-1 max-w-[520px] w-full md:pl-10">
              <button
                onClick={goToPreviousSubStep}
                className="inline-flex items-center gap-2 bg-transparent border-none text-sm sm:text-base font-medium text-green-600 cursor-pointer p-0 mb-4 transition-colors hover:text-green-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-semibold text-foreground mb-2.5 tracking-tight leading-tight">
                Set your password
              </h1>
              <p className="text-base text-muted-foreground mb-7 leading-relaxed">
                Create a strong password with at least 8 characters
              </p>

              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[15px] font-medium text-foreground">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full px-5 py-4 pr-12 text-base text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all bg-background hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.06)]"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      autoFocus
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">Must be at least 8 characters</p>
                </div>

                <button
                  type="submit"
                  disabled={password.length < 8}
                  className="inline-flex items-center justify-center px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-primary-foreground bg-primary border-none rounded-full cursor-pointer transition-all w-fit mt-2.5 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  CONTINUE
                </button>
              </form>
            </div>
            {renderLockIllustration()}
          </>
        );
      }

      // Sub-step 2: Confirm password
      if (subStep === 2) {
        return (
          <>
            <div className="flex-1 max-w-[520px] w-full md:pl-10">
              <button
                onClick={goToPreviousSubStep}
                className="inline-flex items-center gap-2 bg-transparent border-none text-sm sm:text-base font-medium text-green-600 cursor-pointer p-0 mb-4 transition-colors hover:text-green-700"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-semibold text-foreground mb-2.5 tracking-tight leading-tight">
                Confirm your password
              </h1>
              <p className="text-base text-muted-foreground mb-7 leading-relaxed">
                Please re-enter your password to confirm
              </p>

              <form onSubmit={handleConfirmPasswordSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2.5">
                  <label className="text-[15px] font-medium text-foreground">Confirm password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className="w-full px-5 py-4 pr-12 text-base text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all bg-background hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.06)]"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-sm text-red-500">Passwords don't match</p>
                  )}
                  {confirmPassword && confirmPassword === password && (
                    <p className="text-sm text-green-600">Passwords match!</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!confirmPassword || confirmPassword !== password || isLoading}
                  className="inline-flex items-center justify-center gap-2 px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-primary-foreground bg-primary border-none rounded-full cursor-pointer transition-all w-fit mt-2.5 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  {isLoading && <Spinner className="h-4 w-4" />}
                  CREATE ACCOUNT
                </button>
              </form>
            </div>
            {renderLockIllustration()}
          </>
        );
      }
    }

    return null;
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col font-sans overflow-x-hidden">
      {/* Header */}
      <header className="flex justify-between items-center px-5 sm:px-8 md:px-[60px] py-6 md:py-8 w-full shrink-0 relative">
        <div className="flex items-center gap-4 sm:gap-8 md:gap-12">
          <Logo width={70} height={70} />
          {renderStepper()}
        </div>
        <button
          onClick={() => router.push(ROUTES.LOGIN)}
          className="bg-transparent border-none text-sm sm:text-base font-medium text-green-600 cursor-pointer transition-colors px-3 sm:px-4 py-2 rounded-lg hover:text-green-700 hover:bg-green-50"
        >
          Log in
        </button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 px-5 sm:px-8 md:px-[60px] pb-8 md:pb-[60px] pt-5 gap-8 md:gap-[60px] items-center justify-center w-full flex-col md:flex-row">
        {renderStepContent()}
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-5 sm:px-8 md:px-[60px] py-4 shrink-0">
        <button className="bg-transparent border-none text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          English
        </button>
        <button className="w-8 h-8 rounded-full border border-border bg-background text-muted-foreground text-sm font-medium cursor-pointer hover:bg-muted">
          ?
        </button>
      </footer>
    </div>
  );
}
