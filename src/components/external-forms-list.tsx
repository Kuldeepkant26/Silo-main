"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

interface Reviewer {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface RequestForm {
  id: string;
  name: string;
  slug: string;
  tags: string[];
  isActive: boolean;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  reviewerId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewer: Reviewer | null;
}

interface ExternalFormsListProps {
  refreshTrigger: number;
}

export function ExternalFormsList({ refreshTrigger }: ExternalFormsListProps) {
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  
  const [forms, setForms] = useState<RequestForm[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; formId: string; formName: string }>({
    isOpen: false,
    formId: "",
    formName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Reviewer update loading state
  const [updatingReviewerId, setUpdatingReviewerId] = useState<string | null>(null);
  
  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // Fetch forms
  const fetchForms = async () => {
    if (!organizationId) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/get-request-forms/${organizationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setForms(data.requestForms || []);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch reviewers
  const fetchReviewers = async () => {
    if (!organizationId) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/form/reviewers/${organizationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setReviewers(data.reviewers || []);
      }
    } catch (error) {
      console.error("Error fetching reviewers:", error);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchForms();
      fetchReviewers();
    }
  }, [refreshTrigger, organizationId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleReviewerChange = async (formId: string, reviewerId: string) => {
    setUpdatingReviewerId(formId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/form/reviewer-id-update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": AUTH_TOKEN,
        },
        body: JSON.stringify({ formId, reviewerId }),
      });
      if (response.ok) {
        await fetchForms(); // Refresh forms after update - wait for it to complete
      }
    } catch (error) {
      console.error("Error updating reviewer:", error);
    } finally {
      setUpdatingReviewerId(null);
    }
  };

  const openDeleteModal = (formId: string, formName: string) => {
    setDeleteModal({ isOpen: true, formId, formName });
    setOpenMenuId(null);
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, formId: "", formName: "" });
  };

  const handleDelete = async () => {
    if (!organizationId || !deleteModal.formId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/public/delete-request-form/${deleteModal.formId}/${organizationId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": AUTH_TOKEN,
          },
        }
      );
      if (response.ok) {
        await fetchForms(); // Refresh forms after deletion - wait for it to complete
      }
    } catch (error) {
      console.error("Error deleting form:", error);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleCopyLink = (form: RequestForm) => {
    // Link to the external request flow with slug and title
    const link = `${window.location.origin}/external-request?title=${encodeURIComponent(form.name)}&slug=${encodeURIComponent(form.slug)}`;
    navigator.clipboard.writeText(link);
    showToast("Link copied to clipboard!");
    setOpenMenuId(null);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 overflow-hidden"
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.04] to-transparent" />

            <div className="flex items-center gap-4 mb-5">
              <div className="h-6 w-40 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-7 w-28 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 mb-5" />
            <div className="h-11 w-64 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          </div>
        ))}

        <div className="flex justify-center pt-6">
          <div className="flex items-center gap-3">
            <div className="relative h-5 w-5">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-neutral-700" />
              <div className="absolute inset-0 rounded-full border-2 border-black dark:border-white border-t-transparent dark:border-t-transparent animate-spin" />
            </div>
            <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">Loading forms...</span>
          </div>
        </div>
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 rounded-2xl max-w-[720px] text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="h-6 w-6 text-neutral-400 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
        </div>
        <p className="text-lg font-bold text-black dark:text-white mb-1">No external request forms yet</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Click &quot;NEW EXTERNAL REQUEST&quot; to create your first form</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1200px]" style={{ perspective: "1200px" }}>
        <div className="relative pt-2 pb-[120px]">
        {forms.map((form, index) => (
          <div
            key={form.id}
            className="sticky mb-3 will-change-transform"
            style={{
              top: `${index * 12}px`,
              zIndex: index + 1,
            }}
          >
          <div
            className="group relative bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 transition-all duration-500 ease-out hover:border-neutral-300 dark:hover:border-neutral-600 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] overflow-hidden cursor-default"
          >
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-600 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Card Header */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h3 className="text-xl font-bold text-black dark:text-white m-0">{form.name}</h3>
              <div className="flex gap-2 flex-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M11 6H10V4C10 2.34 8.66 1 7 1C5.34 1 4 2.34 4 4V6H3C2.45 6 2 6.45 2 7V12C2 12.55 2.45 13 3 13H11C11.55 13 12 12.55 12 12V7C12 6.45 11.55 6 11 6ZM7 10C6.45 10 6 9.55 6 9C6 8.45 6.45 8 7 8C7.55 8 8 8.45 8 9C8 9.55 7.55 10 7 10ZM5.1 6V4C5.1 2.95 5.95 2.1 7 2.1C8.05 2.1 8.9 2.95 8.9 4V6H5.1Z" fill="currentColor"/>
                  </svg>
                  {form.reviewerId ? "External request" : "Available to everyone"}
                </span>
              </div>
              {/* Three-dot Menu */}
              <div className="relative ml-auto" ref={openMenuId === form.id ? menuRef : null}>
                <button
                  className="p-2 bg-transparent border-none cursor-pointer text-neutral-400 dark:text-neutral-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  onClick={() => setOpenMenuId(openMenuId === form.id ? null : form.id)}
                  aria-label="Open actions"
                >
                  <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
                    <circle cx="2" cy="2" r="2" fill="currentColor"/>
                    <circle cx="2" cy="8" r="2" fill="currentColor"/>
                    <circle cx="2" cy="14" r="2" fill="currentColor"/>
                  </svg>
                </button>
                {openMenuId === form.id && (
                  <div className="absolute right-0 top-full mt-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg min-w-[150px] z-10 overflow-hidden">
                    <button
                      className="block w-full py-3 px-4 bg-transparent border-none text-left text-sm text-destructive cursor-pointer transition-colors hover:bg-destructive/10"
                      onClick={() => openDeleteModal(form.id, form.name)}
                    >
                      Delete
                    </button>
                    {form.reviewerId && (
                      <button
                        className="block w-full py-3 px-4 bg-transparent border-none text-left text-sm text-black dark:text-white cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        onClick={() => handleCopyLink(form)}
                      >
                        Copy link
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 mb-4" />

            {/* Card Body - Reviewer Dropdown */}
            <div className="mb-3">
              <div className="relative max-w-[280px]">
                {updatingReviewerId === form.id && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-neutral-900/80 rounded-lg flex items-center justify-center z-10">
                    <svg className="animate-spin h-5 w-5 text-black dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <select
                  className="w-full py-3 px-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-500 dark:text-neutral-400 cursor-pointer appearance-none pr-10 focus:outline-none focus:border-black dark:focus:border-white disabled:opacity-50 disabled:cursor-not-allowed"
                  value={form.reviewerId || ""}
                  onChange={(e) => handleReviewerChange(form.id, e.target.value)}
                  disabled={updatingReviewerId === form.id}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 16px center",
                  }}
                >
                  <option value="">Reviewer</option>
                  {reviewers.map((reviewer) => (
                    <option key={reviewer.id} value={reviewer.id}>
                      {reviewer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Card Footer - Automatic replies */}
            {form.autoReplyEnabled && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400 text-sm">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8" cy="8" r="3" fill="currentColor"/>
                  </svg>
                  Automatic replies
                </span>
              </div>
            )}
          </div>
          </div>
        ))}

        {/* End of list indicator */}
        {forms.length > 0 && (
          <div className="flex flex-col items-center justify-center py-12 animate-fade-in-up">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-black/5 dark:bg-white/5 animate-ping-slow" />
              <div className="relative flex items-center justify-center h-12 w-12 rounded-full bg-black dark:bg-white">
                <svg className="h-6 w-6 text-white dark:text-black animate-bounce-gentle" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-semibold text-black dark:text-white mb-0.5 animate-fade-in-up-delay-1">
              End of forms
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 animate-fade-in-up-delay-2">
              {forms.length} {forms.length === 1 ? "form" : "forms"} configured
            </p>
          </div>
        )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!isDeleting ? closeDeleteModal : undefined}
          />
          
          {/* Modal */}
          <div className="relative bg-card rounded-2xl shadow-2xl p-8 max-w-[420px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-foreground mb-2">Delete Form</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteModal.formName}"</span>? This action cannot be undone.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 px-4 bg-transparent border-2 border-border rounded-xl text-sm font-semibold text-foreground cursor-pointer transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 px-4 bg-primary border-2 border-primary rounded-xl text-sm font-semibold text-primary-foreground cursor-pointer transition-all hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
                                                   
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-primary-foreground px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17L4 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </>
  );
}




