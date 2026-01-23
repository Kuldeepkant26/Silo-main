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
            "Authorization": AUTH_TOKEN,
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
          "Authorization": AUTH_TOKEN,
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

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, categoryId: "", categoryName: "" });
  };

  const handleDelete = async () => {
    if (!organizationId || !deleteModal.categoryId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/internal/delete-category/${deleteModal.categoryId}/${organizationId}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": AUTH_TOKEN,
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
      <div className="bg-white border border-dashed border-[#d0d0d0] p-6 rounded-xl max-w-[720px]">
        <p className="text-xl font-bold text-[#1a1a1a] mb-1.5">Loading...</p>
        <p className="text-[#666] text-sm">Fetching your categories</p>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className="bg-white border border-dashed border-[#d0d0d0] p-6 rounded-xl max-w-[720px]">
        <p className="text-xl font-bold text-[#1a1a1a] mb-1.5">No categories yet</p>
        <p className="text-[#666] text-sm">Click "CREATE CATEGORY" to create your first category</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-5 max-w-[1200px]">
        {categories.map((category) => (
          <div
            key={category.id}
            className="bg-white border border-[#e0e0e0] rounded-xl p-6 transition-shadow hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] relative"
          >
            {/* Card Header */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
              <h3 className="text-xl font-semibold text-[#1a1a1a] m-0">{category.name}</h3>
              <div className="flex gap-2 flex-1 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#e3f2fd] text-[#1565c0] text-sm font-medium rounded-md">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 2h4l1 1h5v8H2V2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Category
                </span>
                {category.assignedTeam && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f3e5f5] text-[#7b1fa2] text-sm font-medium rounded-md">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="5" r="2" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M3 12c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                    {category.assignedTeam.name}
                  </span>
                )}
              </div>
              {/* Three-dot Menu */}
              <div className="relative ml-auto" ref={openMenuId === category.id ? menuRef : null}>
                <button
                  className="p-2 bg-transparent border-none cursor-pointer text-[#666] rounded hover:bg-[#f5f5f5] transition-colors"
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
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[#e0e0e0] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.15)] min-w-[150px] z-10 overflow-hidden">
                    <button
                      className="block w-full py-3 px-4 bg-transparent border-none text-left text-sm text-[#d32f2f] cursor-pointer transition-colors hover:bg-[#ffebee]"
                      onClick={() => openDeleteModal(category.id, category.name)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Card Body - Reviewer Dropdown */}
            <div className="mb-3">
              <div className="relative max-w-[280px]">
                {updatingReviewerId === category.id && (
                  <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
                    <svg className="animate-spin h-5 w-5 text-[#1a1a1a]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
                <select
                  className="w-full py-3 px-4 bg-white border border-[#e0e0e0] rounded-lg text-sm text-[#666] cursor-pointer appearance-none pr-10 focus:outline-none focus:border-[#1a1a1a] disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Card Footer - Automatic replies */}
            {category.autoReplyEnabled && (
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-[#666] text-sm">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="8" cy="8" r="3" fill="currentColor"/>
                  </svg>
                  Automatic replies
                </span>
              </div>
            )}
          </div>
        ))}
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
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-[420px] w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            
            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-[#1a1a1a] mb-2">Delete Category</h3>
              <p className="text-[#666] text-sm leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[#1a1a1a]">"{deleteModal.categoryName}"</span>? This action cannot be undone.
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                className="flex-1 py-3 px-4 bg-transparent border-2 border-[#e0e0e0] rounded-xl text-sm font-semibold text-[#1a1a1a] cursor-pointer transition-all hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="flex-1 py-3 px-4 bg-[#1a1a1a] border-2 border-[#1a1a1a] rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:bg-[#333] hover:border-[#333] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          <div className="bg-[#1a1a1a] text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3">
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
