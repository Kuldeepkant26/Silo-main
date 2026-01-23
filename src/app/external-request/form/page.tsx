"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { env } from "~/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

export default function ExternalRequestFormPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const title = searchParams.get("title") || "Request";
  const slug = searchParams.get("slug") || "";
  const name = searchParams.get("name") || "";
  const email = searchParams.get("email") || "";

  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [customObjective, setCustomObjective] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const objectiveOptions = [
    "Complaint",
    "Compensation",
    "Repair",
    "Refund",
    "Information request",
    "Technical support",
    "Other",
    "Custom",
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setAttachments([...attachments, ...files]);
    setUploading(true);

    // Simulate upload
    setTimeout(() => {
      setUploading(false);
    }, 1000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (uploading) {
      alert("Please wait for files to finish uploading");
      return;
    }

    if (!description || !objective || (objective === "Custom" && !customObjective.trim())) {
      setError("Please fill in all required fields");
      return;
    }

    if (!slug) {
      setError("Invalid form configuration. Please try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/public/forms/${slug}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": AUTH_TOKEN,
        },
        body: JSON.stringify({
          name,
          email,
          description: `${description}\n\nObjective: ${objective === "Custom" ? customObjective : objective}`,
          attachments: attachments.map((file) => ({
            Key: `ticket-attachments/${file.name}`,
            Id: crypto.randomUUID(),
          })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit ticket");
      }

      const data = await response.json();
      const ticketId = data.ticketId;

      router.push(`/external-request/success?referenceId=${ticketId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request. Please try again.");
      console.error("Error submitting ticket:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/external-request/verify?title=${encodeURIComponent(title)}&slug=${encodeURIComponent(slug)}`);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-10 py-[60px] font-[system-ui]">
      <div className="w-full">
        <div className="flex justify-start mb-[50px]">
          <Image
            src="/Silomainlogo.png"
            alt="SILO"
            width={100}
            height={100}
            className="h-[100px] w-auto object-contain"
          />
        </div>

        <div className="max-w-[560px] w-full px-[60px] py-10 mx-auto animate-in fade-in duration-500">
          <h1 className="text-[32px] font-semibold text-[#1a1a1a] mb-10 tracking-tight">
            Send us your inquiry
          </h1>

          <form onSubmit={handleSave} className="flex flex-col gap-[35px]">
            <div className="flex flex-col gap-3">
              <label className="text-base font-medium text-[#1a1a1a] tracking-tight">
                Description
              </label>
              <textarea
                className="w-full px-5 py-4 text-base text-[#1a1a1a] border-2 border-[#e5e7eb] rounded-xl outline-none transition-all duration-[250ms] bg-white placeholder:text-[#9ca3af] hover:border-[#cbd5e1] focus:border-[#1a1a1a] focus:shadow-[0_0_0_4px_rgba(26,26,26,0.06)] resize-vertical min-h-[120px] leading-[1.6]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your inquiry in detail..."
                rows={4}
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-base font-medium text-[#1a1a1a] tracking-tight">
                Objective
              </label>
              <div className="relative">
                <select
                  className="w-full px-5 py-4 pr-[45px] text-base text-[#1a1a1a] border-2 border-[#e5e7eb] rounded-xl outline-none transition-all duration-[250ms] bg-white cursor-pointer appearance-none hover:border-[#cbd5e1] focus:border-[#1a1a1a] focus:shadow-[0_0_0_4px_rgba(26,26,26,0.06)]"
                  value={objective}
                  onChange={(e) => {
                    setObjective(e.target.value);
                    if (e.target.value !== "Custom") {
                      setCustomObjective("");
                    }
                  }}
                  required
                >
                  <option value="">Complaint, compensation, repair, refund...</option>
                  {objectiveOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <svg
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M5 7.5L10 12.5L15 7.5"
                    stroke="#1a1a1a"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {objective === "Custom" && (
                <input
                  type="text"
                  className="w-full mt-3 px-5 py-4 text-base text-[#1a1a1a] border-2 border-[#e5e7eb] rounded-xl outline-none transition-all duration-[250ms] bg-white placeholder:text-[#9ca3af] hover:border-[#cbd5e1] focus:border-[#1a1a1a] focus:shadow-[0_0_0_4px_rgba(26,26,26,0.06)]"
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  placeholder="Enter your custom objective..."
                  required
                />
              )}
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-base font-medium text-[#1a1a1a] tracking-tight">
                Attach documents
              </label>
              <div className="flex justify-center mt-[10px]">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer transition-transform hover:scale-105"
                >
                  <div className="w-[70px] h-[70px] rounded-full bg-[#1a1a1a] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-all hover:bg-[#2c2c2c] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)]">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21.44 11.05L12.25 20.24C11.1242 21.3658 9.59723 21.9983 8.005 21.9983C6.41277 21.9983 4.88579 21.3658 3.76 20.24C2.63421 19.1142 2.00166 17.5872 2.00166 15.995C2.00166 14.4028 2.63421 12.8758 3.76 11.75L12.33 3.18C13.0806 2.42944 14.0991 2.00667 15.16 2.00667C16.2209 2.00667 17.2394 2.42944 17.99 3.18C18.7406 3.93056 19.1633 4.94908 19.1633 6.01C19.1633 7.07092 18.7406 8.08944 17.99 8.84L9.41 17.41C9.03472 17.7853 8.52544 17.9967 7.995 17.9967C7.46456 17.9967 6.95528 17.7853 6.58 17.41C6.20472 17.0347 5.99329 16.5254 5.99329 15.995C5.99329 15.4646 6.20472 14.9553 6.58 14.58L15.07 6.1"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  {uploading && (
                    <span className="block mt-2 text-xs">Uploading...</span>
                  )}
                </label>
              </div>
              {attachments.length > 0 && (
                <div className="mt-[15px] flex flex-col gap-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="py-[10px] px-[15px] bg-[#f3f4f6] rounded-lg text-sm text-[#1a1a1a] flex items-center gap-2"
                    >
                      {file.name}
                      <span className="ml-2 text-[#4CAF50]">✓</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="flex gap-4 justify-center pt-2">
              <button
                type="button"
                className="px-8 py-[14px] text-sm font-bold tracking-[0.8px] rounded-[28px] cursor-pointer transition-all duration-200 border-2 border-[#e5e7eb] bg-transparent text-[#1a1a1a] uppercase hover:bg-[#f9fafb] active:bg-[#f3f4f6] md:px-12 lg:px-16 lg:min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="px-8 py-[14px] text-sm font-bold tracking-[0.8px] rounded-[28px] cursor-pointer transition-all duration-200 border-2 border-[#1a1a1a] bg-[#1a1a1a] text-white uppercase hover:bg-[#333] hover:border-[#333] active:scale-[0.98] md:px-12 lg:px-16 lg:min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "SUBMITTING..." : "SAVE"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
