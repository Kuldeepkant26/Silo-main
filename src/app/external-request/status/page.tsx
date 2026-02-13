"use client";

import { useSearchParams } from "next/navigation";
import Image from "next/image";

type Status = "submitted" | "awaiting-review" | "resolved";

export default function ExternalRequestStatusPage() {
  const searchParams = useSearchParams();
  const referenceId = searchParams.get("referenceId") || "HGHFE45";

  // Status: 'submitted', 'awaiting-review', 'resolved'
  const currentStatus = "awaiting-review" as Status;

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
            ID: {referenceId}
          </h1>

          {/* Progress Tracker */}
          <div className="flex items-center justify-between mb-8 sm:mb-10 md:mb-12 relative">
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

            <div className="absolute top-5 sm:top-7 md:top-8 left-0 right-0 h-0.5 sm:h-1 bg-[#e5e7eb] -z-0" />
            <div
              className="absolute top-5 sm:top-7 md:top-8 left-0 h-0.5 sm:h-1 bg-[#1a1a1a] -z-0 transition-all duration-500"
              style={{ width: currentStatus === "resolved" ? "100%" : "50%" }}
            />

            <div
              className={`flex flex-col items-center relative z-10 ${
                currentStatus === "awaiting-review" || currentStatus === "resolved"
                  ? ""
                  : "opacity-40"
              }`}
            >
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${
                  currentStatus === "awaiting-review" || currentStatus === "resolved"
                    ? "bg-[#1a1a1a]"
                    : "bg-[#e5e7eb]"
                }`}
              >
                {(currentStatus === "awaiting-review" || currentStatus === "resolved") && (
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

            <div
              className={`flex flex-col items-center relative z-10 ${
                currentStatus === "resolved" ? "" : "opacity-40"
              }`}
            >
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center mb-2 sm:mb-3 shadow-lg ${
                  currentStatus === "resolved" ? "bg-[#1a1a1a]" : "bg-[#e5e7eb]"
                }`}
              >
                {currentStatus === "resolved" && (
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
              <span className="text-[#666]">Awaiting review</span>
            </p>
            <p className="text-base text-[#666]">Estimated response time: 5 days.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
