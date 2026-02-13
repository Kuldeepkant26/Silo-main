"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function ExternalRequestSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referenceId = searchParams.get("referenceId") || "HGHFE45";

  const handleViewStatus = () => {
    router.push(`/external-request/status?referenceId=${referenceId}`);
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

        <div className="max-w-[560px] w-full px-2 sm:px-6 md:px-[60px] py-6 sm:py-8 md:py-10 mx-auto animate-in fade-in duration-500">
          <div className="text-center">
            <h1 className="text-2xl sm:text-[30px] md:text-[36px] font-semibold text-[#1a1a1a] mb-6 sm:mb-8 tracking-tight">
              Inquiry created
            </h1>

            <p className="text-base sm:text-lg text-[#4a4a4a] mb-8 sm:mb-10 leading-relaxed">
              Thank you for contacting us. We will get back to you
              as soon as possible
            </p>

            <div className="flex items-center justify-center gap-2 sm:gap-3 py-4 sm:py-6 px-4 sm:px-8 bg-[#f9fafb] rounded-2xl border-2 border-[#e5e7eb] mb-8 sm:mb-10">
              <span className="text-base font-medium text-[#666]">Inquiry ID:</span>
              <span className="text-xl font-bold text-[#1a1a1a] tracking-tight">
                {referenceId}
              </span>
            </div>

            <p className="text-base text-[#4a4a4a] leading-relaxed">
              You can click{" "}
              <button
                className="text-[#2563eb] font-medium bg-transparent border-none p-0 cursor-pointer text-base transition-colors hover:text-[#1d4ed8] hover:underline"
                onClick={handleViewStatus}
              >
                here
              </button>
              {" "}to view the
              <br />
              status of your request.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
