"use client";

import type { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfDay } from "date-fns";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";

import { env } from "~/env";
import { authClient } from "~/server/auth/client";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from "~/lib/validators/request";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
import { z as zod } from "zod";

const API_BASE_URL = env.NEXT_PUBLIC_API_BASE_URL;
const AUTH_TOKEN = env.NEXT_PUBLIC_API_AUTH_TOKEN;

// Initialize Supabase client for file uploads (client-side only)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Category {
  id: string | number;
  name: string;
}

interface UploadedFile {
  file: File;
  key: string;
  id: string;
  uploaded: boolean;
  error?: string;
}

// Schema for internal request form
const internalRequestSchema = zod
  .object({
    name: zod.string().min(1, { message: "Name is required" }),
    email: zod.string().email({ message: "Valid email is required" }),
    categoryId: zod.string().min(1, { message: "Category is required" }),
    summary: zod.string().min(1, { message: "Summary is required" }),
    description: zod.string().min(1, { message: "Description is required" }),
    startDate: zod
      .date({
        invalid_type_error: "Start date must be a valid date.",
      })
      .optional(),
    endDate: zod
      .date({
        invalid_type_error: "End date must be a valid date.",
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate > data.startDate;
      }
      return true;
    },
    {
      message: "End date must be after start date",
      path: ["endDate"],
    },
  );

export function CreateRequest() {
  const t = useTranslations();
  const { data: auth } = authClient.useSession();
  const organizationId = auth?.session?.activeOrganizationId;
  const userName = auth?.user?.name || "";
  const userEmail = auth?.user?.email || "";

  const [showDialog, setShowDialog] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [showEndDateCalendar, setShowEndDateCalendar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const form = useForm<z.infer<typeof internalRequestSchema>>({
    resolver: zodResolver(internalRequestSchema),
    defaultValues: {
      name: userName,
      email: userEmail,
      categoryId: "",
      summary: "",
      description: "",
    },
  });

  // Update form values when user data is available
  useEffect(() => {
    if (userName) {
      form.setValue("name", userName);
    }
    if (userEmail) {
      form.setValue("email", userEmail);
    }
  }, [userName, userEmail, form]);

  // Fetch categories when drawer opens
  useEffect(() => {
    if (showDialog && organizationId) {
      fetchCategories();
    }
  }, [showDialog, organizationId]);

  const fetchCategories = async () => {
    if (!organizationId) return;
    
    setLoadingCategories(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/internal/get-all-categories/${organizationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();
      // Handle different API response structures (note: API returns "Categories" with capital C)
      const categoriesArray = Array.isArray(data) 
        ? data 
        : (data?.Categories || data?.categories || data?.data || []);
      setCategories(Array.isArray(categoriesArray) ? categoriesArray : []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    } finally {
      setLoadingCategories(false);
    }
  };

  const today = useMemo(() => {
    return startOfDay(new Date());
  }, []);

  // Handle file upload to Supabase
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Check max files limit
    if (uploadedFiles.length + files.length > MAX_FILES_COUNT) {
      setUploadError(`You can upload a maximum of ${MAX_FILES_COUNT} files.`);
      return;
    }

    setUploading(true);
    setUploadError("");

    const newUploadedFiles: UploadedFile[] = [];
    const tempFolderTimestamp = Date.now();

    for (const file of files) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        newUploadedFiles.push({
          file,
          key: "",
          id: crypto.randomUUID(),
          uploaded: false,
          error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
        });
        continue;
      }

      // Validate file type
      if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
        newUploadedFiles.push({
          file,
          key: "",
          id: crypto.randomUUID(),
          uploaded: false,
          error: "Unsupported file type",
        });
        continue;
      }

      const fileId = crypto.randomUUID();
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const filePath = `temp_${tempFolderTimestamp}/${timestamp}_${randomString}.${sanitizedFileName.split('.').pop()}`;

      try {
        const { data, error: uploadErrorResult } = await supabase.storage
          .from("ticket-attachments")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErrorResult) {
          console.error("Upload error:", uploadErrorResult);
          newUploadedFiles.push({
            file,
            key: "",
            id: fileId,
            uploaded: false,
            error: uploadErrorResult.message,
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
      setUploadError(`Failed to upload ${failedUploads.length} file(s).`);
    }

    // Reset file input
    e.target.value = "";
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

  const handleSubmit = async (data: z.infer<typeof internalRequestSchema>) => {
    if (uploading) {
      toast.error("Please wait for files to finish uploading");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get only successfully uploaded files
      const successfulUploads = uploadedFiles.filter((f) => f.uploaded);

      const payload = {
        name: data.name,
        email: data.email,
        categoryId: data.categoryId,
        summary: data.summary,
        description: data.description,
        startDate: data.startDate ? format(data.startDate, "yyyy-MM-dd") : undefined,
        endDate: data.endDate ? format(data.endDate, "yyyy-MM-dd") : undefined,
        attachments: successfulUploads.map((uploadedFile) => ({
          Key: uploadedFile.key,
          Id: uploadedFile.id,
        })),
      };

      const response = await fetch(
        `${API_BASE_URL}/api/internal/create-internal-ticket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": AUTH_TOKEN,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create request");
      }

      const result = await response.json();

      setShowDialog(false);
      setShowStartDateCalendar(false);
      setShowEndDateCalendar(false);
      form.reset({
        name: userName,
        email: userEmail,
        categoryId: "",
        summary: "",
        description: "",
      });
      setUploadedFiles([]);
      setUploadError("");

      toast.success(t("create_request_sucess_title"), {
        description: t("create_request_sucess_description", { id: result.id || "new" }),
        position: "bottom-right",
        dismissible: true,
      });

      // Dispatch event for list refresh
      window.dispatchEvent(new CustomEvent("internal-request-created"));
    } catch (error) {
      console.error("Failed to create request:", error);
      toast.error(t("create_request_error_title"), {
        description: error instanceof Error ? error.message : t("create_request_error_description"),
        position: "bottom-right",
        dismissible: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDialogChange = (open: boolean) => {
    setShowDialog(open);
    if (!open) {
      // Clean up uploaded files when closing
      uploadedFiles.forEach(async (file) => {
        if (file.uploaded && file.key) {
          const filePath = file.key.replace("ticket-attachments/", "");
          await supabase.storage.from("ticket-attachments").remove([filePath]);
        }
      });
      setUploadedFiles([]);
      setUploadError("");
      form.reset({
        name: userName,
        email: userEmail,
        categoryId: "",
        summary: "",
        description: "",
      });
    }
  };

  return (
    <Drawer direction="right" open={showDialog} onOpenChange={handleDialogChange}>
      <DrawerTrigger asChild>
        <Button className="flex items-center gap-x-2 bg-[#1a1a1a] text-white hover:bg-[#333] px-6 py-3 rounded-lg text-sm font-semibold tracking-wide transition-colors">
          <Icons.add className="h-4 w-4" />
          {t("new_request")}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>

          <DrawerTitle className="flex justify-center text-2xl">
            {t("create_request")}
          </DrawerTitle>

          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("create_request_description")} (*)
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            className="flex flex-grow flex-col space-y-4 overflow-y-auto px-4 py-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="flex flex-1 flex-grow flex-col space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}*</FormLabel>

                    <FormControl>
                      <Input
                        id="name"
                        placeholder="e.g. John Doe"
                        type="text"
                        required
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}*</FormLabel>

                    <FormControl>
                      <Input
                        id="email"
                        placeholder="e.g. john@example.com"
                        type="email"
                        required
                        {...field}
                      />
                    </FormControl>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("category")}*</FormLabel>

                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loadingCategories}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={loadingCategories ? "Loading..." : t("select_category")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(categories) && categories.map((category) => (
                          <SelectItem key={String(category.id)} value={String(category.id)}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("summary")}*</FormLabel>

                    <FormControl>
                      <Input
                        id="summary"
                        placeholder="e.g. NDA review for vendor onboarding"
                        type="text"
                        required
                        autoFocus
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t("create_request_summary_form_description")}
                    </FormDescription>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}*</FormLabel>

                    <FormControl>
                      <Textarea
                        placeholder="Description of the request..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t("create_request_description_form_description")}
                    </FormDescription>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start date</FormLabel>

                    <Popover
                      open={showStartDateCalendar}
                      onOpenChange={setShowStartDateCalendar}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button className="border-input" variant="outline">
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                e.g. {format(today, "PPP")}
                              </span>
                            )}
                            <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          id="startDate"
                          mode="single"
                          defaultMonth={field.value}
                          selected={field.value}
                          onSelect={(e) => {
                            field.onChange(e);
                            setShowStartDateCalendar(false);
                          }}
                          disabled={(date) => date < today}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      This will be the displayed request start date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End date</FormLabel>

                    <Popover
                      open={showEndDateCalendar}
                      onOpenChange={setShowEndDateCalendar}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button className="border-input" variant="outline">
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                e.g. {format(today, "PPP")}
                              </span>
                            )}
                            <Icons.calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          id="endDate"
                          mode="single"
                          selected={field.value}
                          defaultMonth={
                            form.getValues("startDate") ?? field.value
                          }
                          onSelect={(e) => {
                            field.onChange(e);
                            setShowEndDateCalendar(false);
                          }}
                          disabled={(date) =>
                            date < (form.getValues("startDate") ?? today)
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      This will be the displayed request end date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Attachments section */}
              <div className="space-y-2">
                <FormLabel className="gap-1">
                  {t("attachments")}{" "}
                  <span className="text-muted-foreground text-xs">
                    {uploadedFiles.length > 0 ? `(${uploadedFiles.length})` : ""}
                  </span>
                </FormLabel>

                <div className="border-input rounded-md border-2 border-dashed p-4">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    multiple
                    accept={ACCEPTED_FILE_TYPES.join(",")}
                    onChange={handleFileChange}
                    disabled={uploading || uploadedFiles.length >= MAX_FILES_COUNT}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 ${
                      uploading || uploadedFiles.length >= MAX_FILES_COUNT
                        ? "cursor-not-allowed opacity-50"
                        : ""
                    }`}
                  >
                    {uploading ? (
                      <Spinner />
                    ) : (
                      <>
                        <Icons.upload className="text-muted-foreground h-8 w-8" />
                        <span className="text-muted-foreground text-sm">
                          Click to upload files
                        </span>
                      </>
                    )}
                  </label>
                </div>

                {uploadError && (
                  <p className="text-destructive text-sm">{uploadError}</p>
                )}

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div
                        key={uploadedFile.id}
                        className={`flex items-center justify-between rounded-md border p-2 ${
                          uploadedFile.uploaded
                            ? "border-green-200 bg-green-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Icons.file className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate text-sm">
                            {uploadedFile.file.name}
                          </span>
                          {!uploadedFile.uploaded && uploadedFile.error && (
                            <span className="text-destructive text-xs">
                              ({uploadedFile.error})
                            </span>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                        >
                          <Icons.close className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <FormDescription>
                  {t("create_request_attachments_form_description", {
                    files: MAX_FILES_COUNT,
                  })}
                </FormDescription>
              </div>
            </div>

            <DrawerFooter className="p-0">
              <Button
                disabled={!form.formState.isValid || isSubmitting || uploading}
                type="submit"
              >
                {isSubmitting ? <Spinner /> : t("create")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
