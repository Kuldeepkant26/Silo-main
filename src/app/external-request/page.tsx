"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function ExternalRequestWelcomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Request";
  const slug = searchParams.get("slug") || "";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5 sm:px-8 md:px-10 py-8 sm:py-12 md:py-[60px] font-[system-ui]">
      <div className="max-w-[800px] w-full px-4 sm:px-8 md:px-[60px] py-8 sm:py-10 animate-in fade-in duration-500">
        <div className="text-left">
          <h1 className="text-2xl sm:text-[32px] md:text-[42px] font-normal text-[#2c2c2c] mb-6 sm:mb-8 md:mb-10 tracking-tight">
            Dear customer,
          </h1>

          <p className="text-lg leading-[1.8] text-[#4a4a4a] mb-[30px] font-normal">
            Thank you for using our service. If you have any request, please fulfill the next{" "}
            <button
              className="text-[#2563eb] font-medium bg-transparent border-none p-0 cursor-pointer text-lg transition-colors hover:text-[#1d4ed8] hover:underline"
              onClick={() => router.push(`/external-request/verify?title=${encodeURIComponent(title)}&slug=${encodeURIComponent(slug)}`)}
            >
              form
            </button>
            {" "}so we can solve it asap.
          </p>

          <p className="text-lg leading-[1.8] text-[#4a4a4a] mb-[30px] font-normal">
            Looking forward to hearing from you and solving your problem asap.
          </p>

          <p className="text-lg text-[#4a4a4a] mt-[50px] font-normal">
            Kind regards,
          </p>
        </div>
      </div>
    </div>
  );
}
