"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { env } from "~/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

type WorkflowStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "OVERDUE" | "REOPEN";
type UIStatus = "submitted" | "in-progress" | "awaiting-review" | "resolved";

/** Map API workflowStatus to the UI step */
function mapWorkflowToUI(ws: WorkflowStatus | string): UIStatus {
  switch (ws) {
    case "DONE":
      return "resolved";
    case "IN_PROGRESS":
      return "in-progress";
    case "OPEN":
    case "REOPEN":
    case "OVERDUE":
    default:
      return "awaiting-review";
  }
}

/** Human-readable label for the status */
function statusLabel(status: UIStatus): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "in-progress":
      return "In progress";
    case "awaiting-review":
      return "Awaiting review";
    case "resolved":
      return "Resolved";
  }
}

/** Progress bar width percentage */
function progressWidth(status: UIStatus): string {
  switch (status) {
    case "submitted":
      return "0%";
    case "awaiting-review":
      return "50%";
    case "in-progress":
      return "50%";
    case "resolved":
      return "100%";
  }
}

export default function ExternalRequestStatusPage() {
  const searchParams = useSearchParams();
  const referenceId = searchParams.get("referenceId") || "";

  const [currentStatus, setCurrentStatus] = useState<UIStatus>("submitted");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!referenceId) {
      setError("No reference ID provided.");
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/tickets/${referenceId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${AUTH_TOKEN}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Unable to fetch ticket status (${response.status})`);
        }

        const data = await response.json() as { ticketId: number; workflowStatus: string };
        setCurrentStatus(mapWorkflowToUI(data.workflowStatus));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load ticket status."
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchStatus();
  }, [referenceId]);

  const stepReached = (step: UIStatus) => {
    const order: UIStatus[] = ["submitted", "awaiting-review", "resolved"];
    const currentIdx = order.indexOf(
      currentStatus === "in-progress" ? "awaiting-review" : currentStatus
    );
    const stepIdx = order.indexOf(step === "in-progress" ? "awaiting-review" : step);
    return currentIdx >= stepIdx;
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 sm:px-6 md:px-10 py-8 sm:py-12 md:py-[60px] font-[system-ui]">
      <div className="w-full">
        <div className="flex justify-start mb-8 sm:mb-10 md:mb-[50px] px-1">
          <Image
            src="/Silomainlogo.png"
            alt="SILO"
            width={100}
            height={100}
            className="h-16 sm:h-20 md:h-[100px] w-auto object-contain"
          />
        </div>

        <div className="max-w-[700px] w-full px-2 sm:px-6 md:px-[60px] py-6 sm:py-8 md:py-10 mx-auto animate-in fade-in duration-500">
          <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-bold text-[#1a1a1a] mb-8 sm:mb-10 md:mb-12 tracking-tight">
            ID: {referenceId || "—"}
          </h1>

          {/* Loading state */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-[#e5e7eb] border-t-[#1a1a1a] rounded-full animate-spin mb-4" />
              <p className="text-[#666] text-base">Loading ticket status…</p>
            </div>
          )}

          {/* Error state */}
          {!loading && error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 text-center">
              <p className="text-red-600 text-base font-medium">{error}</p>
            </div>
          )}

          {/* Status content */}
          {!loading && !error && (
            <>
              {/* Progress Tracker */}
              <div className="flex items-center justify-between mb-8 sm:mb-10 md:mb-12 relative">
                {/* Step: Submitted */}
                <div className="flex flex-col items-center relative z-10">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-2 sm:mb-3 shadow-lg">
                    <svg width="16" height="16" className="sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M20 6L9 17L4 12"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#1a1a1a] text-center">Submitted</span>
                </div>

                {/* Progress bar track */}
                <div className="absolute top-5 sm:top-7 md:top-8 left-0 right-0 h-0.5 sm:h-1 bg-[#e5e7eb] -z-0" />
                <div
                  className="absolute top-5 sm:top-7 md:top-8 left-0 h-0.5 sm:h-1 bg-[#1a1a1a] -z-0 transition-all duration-500"
                  style={{ width: progressWidth(currentStatus) }}
                />

                {/* Step: Awaiting review */}
                <div
                  className={`flex flex-col items-center relative z-10 ${
                    stepReached("awaiting-review") ? "" : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${
                      stepReached("awaiting-review") ? "bg-[#1a1a1a]" : "bg-[#e5e7eb]"
                    }`}
                  >
                    {stepReached("awaiting-review") && (
                      <svg width="16" height="16" className="sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#1a1a1a] text-center">Awaiting review</span>
                </div>

                {/* Step: Resolved */}
                <div
                  className={`flex flex-col items-center relative z-10 ${
                    stepReached("resolved") ? "" : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${
                      stepReached("resolved") ? "bg-[#1a1a1a]" : "bg-[#e5e7eb]"
                    }`}
                  >
                    {stepReached("resolved") && (
                      <svg width="16" height="16" className="sm:w-5 sm:h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="white"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#1a1a1a] text-center">Resolved</span>
                </div>
              </div>

              {/* Status Information */}
              <div className="bg-[#f9fafb] rounded-2xl p-5 sm:p-6 md:p-8 mb-6 sm:mb-8 border-2 border-[#e5e7eb]">
                <p className="text-lg mb-2">
                  <span className="font-semibold text-[#1a1a1a]">Status:</span>{" "}
                  <span className="text-[#666]">{statusLabel(currentStatus)}</span>
                </p>
                {currentStatus !== "resolved" && (
                  <p className="text-base text-[#666]">Estimated response time: 5 days.</p>
                )}
                {currentStatus === "resolved" && (
                  <p className="text-base text-[#666]">Your request has been resolved.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
