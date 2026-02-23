"use client";

import { useState, useEffect, useRef } from "react";
import { authClient } from "~/server/auth/client";
import { env } from "~/env";
import { api } from "~/trpc/react";

import { getSessionAuthHeader } from "~/lib/api-auth";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;

interface Reviewer {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface Team {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  organizationId: string;
  assignedTeamId: string | null;
  autoReplyEnabled: boolean;
  autoReplyMessage: string;
  reviewerId: string | null;
  createdAt: string;
  updatedAt: string;
  reviewer: Reviewer | null;
  assignedTeam: Team | null;
}

interface CategoriesListProps {
  refreshTrigger: number;
}

export function CategoriesList({ refreshTrigger }: CategoriesListProps) {
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  const authHeader = getSessionAuthHeader(auth);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; categoryId: string; categoryName: string }>({
    isOpen: false,
    categoryId: "",
    categoryName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit modal state
  const [editModal, setEditModal] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null,
  });
  const [editName, setEditName] = useState("");
  const [editAssignedTeamId, setEditAssignedTeamId] = useState("");
  const [editReviewerId, setEditReviewerId] = useState<string>("");
  const [editAutoReplyEnabled, setEditAutoReplyEnabled] = useState(false);
  const [editAutoReplyMessage, setEditAutoReplyMessage] = useState("");
  const [isUpdatingEdit, setIsUpdatingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Fetch teams using tRPC
  const { data: teams, isLoading: teamsLoading } = api.team.getAllByOrganization.useQuery(
    undefined,
    { enabled: editModal.isOpen }
  );
  
  // Reviewer update loading state
  const [updatingReviewerId, setUpdatingReviewerId] = useState<string | null>(null);
  
  // Toast notification state
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

  // Fetch categories
  const fetchCategories = async () => {
    if (!organizationId) return;
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/internal/get-all-categories/${organizationId}`,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": authHeader ?? "",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setCategories(data.Categories || []);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
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
            "Authorization": authHeader ?? "",
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
      fetchCategories();
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

  const handleReviewerChange = async (categoryId: string, reviewerId: string) => {
    setUpdatingReviewerId(categoryId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/internal/update-category-reviewer`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader ?? "",
        },
        body: JSON.stringify({ categoryId, reviewerId }),
      });
      if (response.ok) {
        await fetchCategories(); // Refresh categories after update
      }
    } catch (error) {
      console.error("Error updating reviewer:", error);
    } finally {
      setUpdatingReviewerId(null);
    }
  };

  const openDeleteModal = (categoryId: string, categoryName: string) => {
    setDeleteModal({ isOpen: true, categoryId, categoryName });
    setOpenMenuId(null);
  };

  const openEditModal = (category: Category) => {
    setEditModal({ isOpen: true, category });
    setEditName(category.name);
    setEditAssignedTeamId(category.assignedTeamId || "");
    setEditReviewerId(category.reviewerId || "");
    setEditAutoReplyEnabled(category.autoReplyEnabled);
    setEditAutoReplyMessage(category.autoReplyMessage || "");
    setEditError("");
    setOpenMenuId(null);
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, category: null });
    setEditName("");
    setEditAssignedTeamId("");
    setEditReviewerId("");
    setEditAutoReplyEnabled(false);
    setEditAutoReplyMessage("");
    setEditError("");
  };

  const handleEditSave = async () => {
    if (!editModal.category || !organizationId) return;

    setIsUpdatingEdit(true);
    setEditError("");

    // Build payload with only changed fields
    const original = editModal.category;
    const payload: Record<string, unknown> = {};

    if (editName.trim() !== original.name) payload.name = editName.trim();
    if (editAssignedTeamId !== (original.assignedTeamId || "")) payload.assignedTeamId = editAssignedTeamId || null;
    if (editAutoReplyEnabled !== original.autoReplyEnabled) payload.autoReplyEnabled = editAutoReplyEnabled;
    if (editAutoReplyMessage !== (original.autoReplyMessage || "")) payload.autoReplyMessage = editAutoReplyEnabled ? editAutoReplyMessage : "";
    if (editReviewerId !== (original.reviewerId || "")) payload.reviewerId = editReviewerId || null;

    // Always include organizationId
    payload.organizationId = organizationId;

    if (Object.keys(payload).length === 1) {
      // Only organizationId, nothing changed
      closeEditModal();
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/internal/update-category/${original.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader ?? "",
        },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        await fetchCategories();
        closeEditModal();
        showToast("Category updated successfully");
      } else {
        setEditError("Failed to update category. Please try again.");
      }
    } catch (error) {
      console.error("Error updating category:", error);
      setEditError("Failed to update category. Please try again.");
    } finally {
      setIsUpdatingEdit(false);
    }
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, categoryId: "", categoryName: "" });
  };

  const handleDelete = async () => {
    if (!organizationId || !deleteModal.categoryId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/internal/delete-category/${deleteModal.categoryId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": authHeader ?? "",
          },
        }
      );
      if (response.ok) {
        await fetchCategories(); // Refresh categories after deletion
      }
    } catch (error) {
      console.error("Error deleting category:", error);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="relative bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 overflow-hidden"
          >
            {/* Shimmer overlay */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-black/[0.04] dark:via-white/[0.04] to-transparent" />

            <div className="flex items-center gap-4 mb-5">
              <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-800" />
              <div className="h-6 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-800" />
            </div>
            <div className="flex items-center gap-2 mb-5 ml-[52px]">
              <div className="h-7 w-28 rounded-lg bg-neutral-100 dark:bg-neutral-800" />
            </div>
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent mb-5" />
            <div className="mb-2">
              <div className="h-4 w-32 rounded bg-neutral-100 dark:bg-neutral-800 mb-2" />
              <div className="h-11 w-80 rounded-xl bg-neutral-100 dark:bg-neutral-800" />
            </div>
          </div>
        ))}

        <div className="flex justify-center pt-6">
          <div className="flex items-center gap-3">
            <div className="relative h-5 w-5">
              <div className="absolute inset-0 rounded-full border-2 border-neutral-200 dark:border-neutral-700" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent dark:border-t-transparent animate-spin" />
            </div>
            <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">Loading categories...</span>
          </div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-8 rounded-2xl max-w-[720px] text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg className="h-6 w-6 text-neutral-400 dark:text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </div>
        </div>
        <p className="text-lg font-bold text-black dark:text-white mb-1">No categories yet</p>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Click &quot;CREATE CATEGORY&quot; to create your first category</p>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-[1200px]" style={{ perspective: "1200px" }}>
        <div className="relative pt-2 pb-[120px]">
        {categories.map((category, index) => (
          <div
            key={category.id}
            className="sticky mb-3 will-change-transform"
            style={{
              top: `${index * 12}px`,
              zIndex: index + 1,
            }}
          >
          <div
            className="group relative bg-gradient-to-br from-white to-neutral-50/50 dark:from-neutral-900 dark:to-neutral-900/50 border-2 border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 transition-all duration-500 ease-out hover:border-neutral-300 dark:hover:border-neutral-600 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_2px_20px_-4px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_40px_-8px_rgba(0,0,0,0.6)] overflow-hidden cursor-default hover:scale-[1.01]"
          >
            {/* Card Header */}
            <div className="flex items-center gap-3 mb-5 flex-wrap">
              {/* Category Icon */}
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-black dark:text-white m-0 leading-tight">{category.name}</h3>
              
              {/* Team Badge */}
              {category.assignedTeam ? (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold rounded-lg border border-emerald-200 dark:border-emerald-700/50 shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M3 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {category.assignedTeam.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 text-sm font-semibold rounded-lg border border-amber-200 dark:border-amber-700/50 shadow-sm">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 13A6 6 0 1 0 7 1a6 6 0 0 0 0 12Z" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 1a6 6 0 0 1 0 12M7 1a6 6 0 0 0 0 12" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M1 7h12" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                  Available to everyone
                </span>
              )}
              
              {/* Three-dot Menu */}
              <div className="relative flex-shrink-0 ml-auto" ref={openMenuId === category.id ? menuRef : null}>
                <button
                  className="p-2.5 bg-white/50 dark:bg-neutral-800/50 backdrop-blur-sm border border-neutral-200 dark:border-neutral-700 cursor-pointer text-neutral-500 dark:text-neutral-400 rounded-lg hover:bg-white dark:hover:bg-neutral-800 hover:text-black dark:hover:text-white transition-all duration-200 hover:shadow-md"
                  onClick={() => setOpenMenuId(openMenuId === category.id ? null : category.id)}
                  aria-label="Open actions"
                >
                  <svg width="4" height="16" viewBox="0 0 4 16" fill="none">
                    <circle cx="2" cy="2" r="2" fill="currentColor"/>
                    <circle cx="2" cy="8" r="2" fill="currentColor"/>
                    <circle cx="2" cy="14" r="2" fill="currentColor"/>
                  </svg>
                </button>
                {openMenuId === category.id && (
                  <div className="absolute right-0 top-full mt-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl min-w-[160px] z-10 overflow-hidden backdrop-blur-sm">
                    <button
                      className="block w-full py-3 px-4 bg-transparent border-none text-left text-sm font-medium text-black dark:text-white cursor-pointer transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                      onClick={() => openEditModal(category)}
                    >
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Edit
                      </span>
                    </button>
                    <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-2" />
                    <button
                      className="block w-full py-3 px-4 bg-transparent border-none text-left text-sm font-medium text-red-600 dark:text-red-400 cursor-pointer transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => openDeleteModal(category.id, category.name)}
                    >
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Delete
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 dark:via-neutral-700 to-transparent mb-5" />

            {/* Card Body - Reviewer Dropdown */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2 block">
                Assigned Reviewer
              </label>
              <div className="relative max-w-[320px]">
                {updatingReviewerId === category.id && (
                  <div className="absolute inset-0 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                    <svg className="animate-spin h-5 w-5 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round"/>
                      <circle cx="12" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <select
                    className="w-full py-3 pl-11 pr-10 bg-white dark:bg-neutral-800/50 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer appearance-none focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-600"
                    value={category.reviewerId || ""}
                    onChange={(e) => handleReviewerChange(category.id, e.target.value)}
                    disabled={updatingReviewerId === category.id}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                    }}
                  >
                    <option value="">Select Reviewer</option>
                    {reviewers.map((reviewer) => (
                      <option key={reviewer.id} value={reviewer.id}>
                        {reviewer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Card Footer - Automatic replies */}
            {category.autoReplyEnabled && (
              <div className="flex items-center gap-3 pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-600 dark:text-purple-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 10h.01M12 10h.01M16 10h.01" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 block">Automatic Replies Enabled</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">Auto-responding to requests</span>
                </div>
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50" />
              </div>
            )}
          </div>
          </div>
        ))}

        {/* End of list indicator */}
        {categories.length > 0 && (
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
              End of categories
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 animate-fade-in-up-delay-2">
              {categories.length} {categories.length === 1 ? "category" : "categories"} configured
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
              <h3 className="text-xl font-bold text-foreground mb-2">Delete Category</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-foreground">"{deleteModal.categoryName}"</span>? This action cannot be undone.
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

      {/* Edit Category Modal */}
      {editModal.isOpen && editModal.category && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={!isUpdatingEdit ? closeEditModal : undefined}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl max-w-[520px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-10">
              <h2 className="text-2xl font-semibold text-foreground mb-2 leading-tight tracking-tight">
                Edit Category
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Update the details for this category
              </p>

              {/* Category Name */}
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground mb-2 block">Category Name</label>
                <input
                  type="text"
                  className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 bg-background placeholder:text-muted-foreground hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Category name"
                  disabled={isUpdatingEdit}
                />
              </div>

              {/* Assigned Team Dropdown */}
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground mb-2 block">Assign to Team (Optional)</label>
                <div className="relative">
                  <select
                    className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 bg-background cursor-pointer appearance-none pr-10 hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                    value={editAssignedTeamId}
                    onChange={(e) => setEditAssignedTeamId(e.target.value)}
                    disabled={isUpdatingEdit || teamsLoading}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                    }}
                  >
                    <option value="">{teamsLoading ? "Loading..." : "No team assigned"}</option>
                    {(teams ?? []).map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                  {teamsLoading && (
                    <div className="absolute right-10 top-1/2 -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviewer Dropdown */}
              <div className="mb-5">
                <label className="text-sm font-medium text-foreground mb-2 block">Reviewer</label>
                <div className="relative">
                  <select
                    className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 bg-background cursor-pointer appearance-none pr-10 hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)] disabled:opacity-50 disabled:cursor-not-allowed"
                    value={editReviewerId}
                    onChange={(e) => setEditReviewerId(e.target.value)}
                    disabled={isUpdatingEdit}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 16px center",
                    }}
                  >
                    <option value="">Select Reviewer</option>
                    {reviewers.map((reviewer) => (
                      <option key={reviewer.id} value={reviewer.id}>
                        {reviewer.name} ({reviewer.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Auto Reply Toggle */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <span className="text-sm font-medium text-foreground">Enable Auto Reply</span>
                <button
                  type="button"
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${editAutoReplyEnabled ? "bg-primary" : "bg-muted"}`}
                  onClick={() => setEditAutoReplyEnabled(!editAutoReplyEnabled)}
                  disabled={isUpdatingEdit}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-background rounded-full transition-transform duration-200 ${editAutoReplyEnabled ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>

              {/* Auto Reply Message */}
              {editAutoReplyEnabled && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">Auto Reply Message</label>
                  <textarea
                    className="w-full px-[18px] py-4 text-[15px] text-foreground border-[1.5px] border-border rounded-[10px] outline-none transition-all duration-200 bg-background placeholder:text-muted-foreground hover:border-muted-foreground focus:border-foreground focus:shadow-[0_0_0_3px_rgba(var(--foreground),0.08)] resize-none min-h-[100px] disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter the auto-reply message..."
                    value={editAutoReplyMessage}
                    onChange={(e) => setEditAutoReplyMessage(e.target.value)}
                    disabled={isUpdatingEdit}
                  />
                </div>
              )}

              {editError && (
                <p className="text-sm text-red-500 mt-4">{editError}</p>
              )}

              <div className="flex gap-3 justify-center items-center mt-6">
                <button
                  className="px-8 py-[14px] text-[13px] font-semibold tracking-[0.5px] rounded-[28px] cursor-pointer transition-all duration-200 border-[1.5px] border-border bg-transparent text-foreground uppercase hover:bg-muted hover:border-muted-foreground active:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={closeEditModal}
                  disabled={isUpdatingEdit}
                >
                  CANCEL
                </button>
                <button
                  className="px-8 py-[14px] text-[13px] font-semibold tracking-[0.5px] rounded-[28px] cursor-pointer transition-all duration-200 border-[1.5px] border-primary bg-primary text-primary-foreground uppercase hover:bg-primary/90 hover:border-primary/90 active:bg-primary active:transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={handleEditSave}
                  disabled={isUpdatingEdit || !editName.trim()}
                >
                  {isUpdatingEdit ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      SAVING...
                    </>
                  ) : (
                    "SAVE"
                  )}
                </button>
              </div>
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
