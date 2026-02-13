"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

// Initialize Supabase client for file uploads
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface UploadedFile {
  file: File;
  key: string;
  id: string;
  uploaded: boolean;
  error?: string;
}

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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedVersions, setEnhancedVersions] = useState<string[]>([]);
  const [showEnhanced, setShowEnhanced] = useState(false);

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

  const handleEnhanceDescription = async () => {
    if (!description.trim() || description.length < 10) {
      return;
    }

    setIsEnhancing(true);
    try {
      const response = await fetch("/api/agent/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: description }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.enhancedVersions && data.enhancedVersions.length > 0) {
          setEnhancedVersions(data.enhancedVersions);
          setShowEnhanced(true);
        }
      }
    } catch (err) {
      console.error("Failed to enhance description:", err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setError("");

    const newUploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      const fileId = crypto.randomUUID();
      // Create a unique filename with timestamp to avoid collisions
      const timestamp = new Date().toISOString().replace(/[:.]/g, "_");
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `${timestamp}_${sanitizedFileName}`;
      
      try {
        // Upload file to Supabase storage
        const { data, error: uploadError } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          newUploadedFiles.push({
            file,
            key: "",
            id: fileId,
            uploaded: false,
            error: uploadError.message,
          });
        } else {
          console.log("Upload successful:", data);
          newUploadedFiles.push({
            file,
            key: `ticket-attachments/${data.path}`,
            id: fileId,
            uploaded: true,
          });
        }
      } catch (err) {
        console.error("Upload exception:", err);
        newUploadedFiles.push({
          file,
          key: "",
          id: fileId,
          uploaded: false,
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    }

    setUploadedFiles([...uploadedFiles, ...newUploadedFiles]);
    setUploading(false);

    // Check if any uploads failed
    const failedUploads = newUploadedFiles.filter((f) => !f.uploaded);
    if (failedUploads.length > 0) {
      setError(`Failed to upload ${failedUploads.length} file(s). Please try again.`);
    }
  };

  const handleRemoveFile = async (index: number) => {
    const fileToRemove = uploadedFiles[index];
    
    // If the file was uploaded, delete it from Supabase
    if (fileToRemove?.uploaded && fileToRemove.key) {
      const filePath = fileToRemove.key.replace("ticket-attachments/", "");
      await supabase.storage.from("ticket-attachments").remove([filePath]);
    }
    
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
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

    // Check if all files were uploaded successfully
    const successfulUploads = uploadedFiles.filter((f) => f.uploaded);

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
          attachments: successfulUploads.map((uploadedFile) => ({
            Key: uploadedFile.key,
            Id: uploadedFile.id,
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
          <h1 className="text-2xl sm:text-[28px] md:text-[32px] font-semibold text-[#1a1a1a] mb-6 sm:mb-8 md:mb-10 tracking-tight">
            Send us your inquiry
          </h1>

          <form onSubmit={handleSave} className="flex flex-col gap-[35px]">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-base font-medium text-[#1a1a1a] tracking-tight">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleEnhanceDescription}
                  disabled={isEnhancing || description.length < 10}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a1a1a] bg-[#f5f5f5] rounded-full hover:bg-[#e5e5e5] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#f5f5f5]"
                  title={description.length < 10 ? "Type at least 10 characters to enhance" : "Enhance with AI"}
                >
                  {isEnhancing ? (
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {isEnhancing ? "Enhancing..." : "Enhance"}
                </button>
              </div>
              <textarea
                className="w-full px-5 py-4 text-base text-[#1a1a1a] border-2 border-[#e5e7eb] rounded-xl outline-none transition-all duration-[250ms] bg-white placeholder:text-[#9ca3af] hover:border-[#cbd5e1] focus:border-[#1a1a1a] focus:shadow-[0_0_0_4px_rgba(26,26,26,0.06)] resize-vertical min-h-[120px] leading-[1.6]"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe your inquiry in detail..."
                rows={4}
                required
              />
              
              {/* Enhanced Versions */}
              {showEnhanced && enhancedVersions.length > 0 && (
                <div className="mt-3 p-3 bg-[#f9f9f9] rounded-xl border border-[#e5e7eb]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#1a1a1a]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-xs font-semibold text-[#1a1a1a]">Enhanced Versions</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowEnhanced(false);
                        setEnhancedVersions([]);
                      }}
                      className="text-[#9ca3af] hover:text-[#1a1a1a] transition-colors p-0.5"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {enhancedVersions.map((version, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setDescription(version);
                          setShowEnhanced(false);
                          setEnhancedVersions([]);
                        }}
                        className="w-full p-3 text-left text-sm rounded-lg bg-white border border-[#e5e7eb] hover:border-[#1a1a1a] hover:bg-[#fafafa] transition-all duration-200 group"
                      >
                        <p className="text-[#4a4a4a] group-hover:text-[#1a1a1a] leading-relaxed line-clamp-3">
                          {version}
                        </p>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-[#9ca3af] mt-2 text-center">Click any version to use it</p>
                </div>
              )}
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
                    <span className="block mt-2 text-xs text-center">Uploading...</span>
                  )}
                </label>
              </div>
              {uploadedFiles.length > 0 && (
                <div className="mt-[15px] flex flex-col gap-2">
                  {uploadedFiles.map((uploadedFile, index) => (
                    <div
                      key={uploadedFile.id}
                      className={`py-[10px] px-[15px] rounded-lg text-sm text-[#1a1a1a] flex items-center justify-between ${
                        uploadedFile.uploaded ? "bg-[#f3f4f6]" : "bg-red-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {uploadedFile.file.name}
                        {uploadedFile.uploaded ? (
                          <span className="ml-2 text-[#4CAF50]">✓</span>
                        ) : (
                          <span className="ml-2 text-red-500">✗</span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
              <button
                type="button"
                className="w-full sm:w-auto px-8 py-[14px] text-sm font-bold tracking-[0.8px] rounded-[28px] cursor-pointer transition-all duration-200 border-2 border-[#e5e7eb] bg-transparent text-[#1a1a1a] uppercase hover:bg-[#f9fafb] active:bg-[#f3f4f6] sm:px-10 md:px-12 lg:px-16 lg:min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                CANCEL
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-[14px] text-sm font-bold tracking-[0.8px] rounded-[28px] cursor-pointer transition-all duration-200 border-2 border-[#1a1a1a] bg-[#1a1a1a] text-white uppercase hover:bg-[#333] hover:border-[#333] active:scale-[0.98] sm:px-10 md:px-12 lg:px-16 lg:min-w-[160px] disabled:opacity-50 disabled:cursor-not-allowed"
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
