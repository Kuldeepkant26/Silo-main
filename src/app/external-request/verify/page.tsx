"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

export default function ExternalRequestVerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Request";
  const slug = searchParams.get("slug") || "";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const avatarUrl =
    "https://img.freepik.com/free-photo/emotions-people-concept-headshot-serious-looking-handsome-man-with-beard-looking-confident-determined_1258-26730.jpg?semt=ais_hybrid&w=740&q=80";

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && email) {
      router.push(`/external-request/form?title=${encodeURIComponent(title)}&slug=${encodeURIComponent(slug)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white block px-0 pt-0 pb-0 font-[system-ui]">
      <div className="flex items-center gap-4 sm:gap-[30px] pt-8 sm:pt-12 md:pt-[60px] px-5 sm:px-8 md:px-16 lg:px-[100px] mb-10 sm:mb-14 md:mb-20">
        <div className="flex justify-start mb-0">
          <Image
            src="/Silomainlogo.png"
            alt="SILO"
            width={100}
            height={100}
            className="h-[100px] w-auto object-contain"
          />
        </div>

        <div className="flex justify-center mt-5">
          <div className="w-[70px] h-[75px] flex items-center justify-center">
            <svg
              className="w-full h-full"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              style={{ filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1))" }}
            >
              <defs>
                <clipPath id="circular-clip">
                  <circle cx="50" cy="40" r="28" />
                </clipPath>
              </defs>
              <path
                className="fill-black stroke-black stroke-1"
                d="M50 10 C25 10 10 25 10 45 C10 55 15 63 22 68 L20 85 L37 75 C41 77 45 78 50 78 C75 78 90 63 90 45 C90 25 75 10 50 10 Z"
              />
              <image
                href={avatarUrl}
                x="22"
                y="12"
                width="56"
                height="56"
                clipPath="url(#circular-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="px-5 sm:px-8 md:px-16 lg:px-[100px] max-w-[600px] lg:ml-[170px]">
        <form onSubmit={handleContinue} className="flex flex-col gap-6 sm:gap-[35px]">
          <div className="flex flex-col gap-3">
            <label className="text-base font-medium text-[#1a1a1a] tracking-tight">
              Name
            </label>
            <input
              type="text"
              className="w-full px-5 py-4 text-base text-[#1a1a1a] border-2 border-[#e5e7eb] rounded-xl outline-none transition-all duration-[250ms] bg-white placeholder:text-[#9ca3af] hover:border-[#cbd5e1] focus:border-[#1a1a1a] focus:shadow-[0_0_0_4px_rgba(26,26,26,0.06)]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-base font-medium text-[#1a1a1a] tracking-tight">
              Email
            </label>
            <input
              type="email"
              className="w-full px-5 py-4 text-base text-[#1a1a1a] border-2 border-[#e5e7eb] rounded-xl outline-none transition-all duration-[250ms] bg-white placeholder:text-[#9ca3af] hover:border-[#cbd5e1] focus:border-[#1a1a1a] focus:shadow-[0_0_0_4px_rgba(26,26,26,0.06)]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full px-8 py-5 text-sm font-bold tracking-[0.8px] rounded-xl cursor-pointer transition-all duration-200 border-2 border-[#1a1a1a] bg-[#1a1a1a] text-white uppercase hover:bg-[#333] hover:border-[#333] active:scale-[0.98]"
          >
            CONTINUE
          </button>
        </form>
      </div>
    </div>
  );
}
