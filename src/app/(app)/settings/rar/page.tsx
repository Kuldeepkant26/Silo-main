"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { BackButton } from "~/components/back-button";
import { CategoriesList } from "~/components/categories-list";
import { CategoryModal } from "~/components/category-modal";
import { ExternalFormsList } from "~/components/external-forms-list";
import { ExternalRequestModal } from "~/components/external-request-modal";
import { Tags } from "~/components/tags";
import { ROUTES } from "~/constants/routes";

export default function SettingsRequestsAndReviewsPage() {
  const t = useTranslations();
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("categories");
  const [formsRefreshTrigger, setFormsRefreshTrigger] = useState(0);
  const [categoriesRefreshTrigger, setCategoriesRefreshTrigger] = useState(0);

  const handleCreateExternal = () => {
    setIsExternalModalOpen(true);
  };

  const handleCreateCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const handleFormCreated = () => {
    setFormsRefreshTrigger((prev) => prev + 1);
  };

  const handleCategoryCreated = () => {
    setCategoriesRefreshTrigger((prev) => prev + 1);
  };

  return (
    <section className="flex flex-col h-screen overflow-hidden p-10 pb-4">
      {/* Fixed upper section */}
      <div className="shrink-0">
        <header className="flex items-end justify-between mb-8">
          <div className="flex flex-col items-start gap-y-4">
            <BackButton
              className="!px-0 text-foreground hover:text-foreground/80"
              route={ROUTES.SETTINGS}
              label="back_to_settings"
            />

            <h1 className="text-4xl font-bold text-foreground">{t("requests_and_reviews")}</h1>
          </div>
        </header>

        <div className="max-w-[1200px] w-full">
          <div className="flex justify-between items-center flex-wrap gap-5 mb-4">
            {/* Tabs with underline style */}
            <div className="flex gap-[30px] border-b-2 border-border pb-[2px]">
              <button
                className={`py-3 px-1 bg-transparent border-none text-base font-medium cursor-pointer relative transition-colors ${activeTab === "categories" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                onClick={() => setActiveTab("categories")}
              >
                Categories
                {activeTab === "categories" && (
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-foreground" />
                )}
              </button>
              <button
                className={`py-3 px-1 bg-transparent border-none text-base font-medium cursor-pointer relative transition-colors ${activeTab === "tags" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                onClick={() => setActiveTab("tags")}
              >
                Tags
                {activeTab === "tags" && (
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-foreground" />
                )}
              </button>
              <button
                className={`py-3 px-1 bg-transparent border-none text-base font-medium cursor-pointer relative transition-colors ${activeTab === "external" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80"}`}
                onClick={() => setActiveTab("external")}
              >
                External
                {activeTab === "external" && (
                  <span className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-foreground" />
                )}
              </button>
            </div>

            {/* CTA Button */}
            <button 
              className="py-3 px-6 bg-primary text-primary-foreground border-none rounded-lg text-sm font-semibold tracking-[0.5px] cursor-pointer transition-colors hover:bg-primary/90 whitespace-nowrap"
              onClick={activeTab === "external" ? handleCreateExternal : activeTab === "categories" ? handleCreateCategory : undefined}
            >
              {activeTab === "tags" ? "CREATE TAG" : activeTab === "external" ? "NEW EXTERNAL REQUEST" : "CREATE CATEGORY"}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable tab content */}
      <div className="flex-1 min-h-0 overflow-y-auto max-w-[1200px] w-full scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {/* Tab Content */}
        {activeTab === "categories" && (
          <CategoriesList refreshTrigger={categoriesRefreshTrigger} />
        )}

        {activeTab === "tags" && (
          <Tags />
        )}

        {activeTab === "external" && (
          <ExternalFormsList refreshTrigger={formsRefreshTrigger} />
        )}
      </div>

      <ExternalRequestModal 
        isOpen={isExternalModalOpen} 
        onClose={() => setIsExternalModalOpen(false)} 
        onFormCreated={handleFormCreated}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategoryCreated={handleCategoryCreated}
      />
    </section>
  );
}
