"use client";

import type { z } from "zod";
import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, startOfDay } from "date-fns";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { createRequestTRPCSchema } from "~/lib/validators/request";
import { fileToBase64 } from "~/lib/utils";
import {
  ACCEPTED_FILE_TYPES,
  createRequestSchema,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from "~/lib/validators/request";
import { api } from "~/trpc/react";

import { FileDropzone } from "./file-dropzone";
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
import { Textarea } from "./ui/textarea";

export function CreateRequest() {
  const t = useTranslations();
  const utils = api.useUtils();

  const [showDialog, setShowDialog] = useState(false);
  const [showStartDateCalendar, setShowStartDateCalendar] = useState(false);
  const [showDueDateCalendar, setShowDueDateCalendar] = useState(false);

  const form = useForm<z.infer<typeof createRequestSchema>>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      summary: "",
      attachments: [],
    },
  });

  const today = useMemo(() => {
    return startOfDay(new Date());
  }, []);

  const createRequestMutation = api.request.create.useMutation({
    onSuccess: async (data) => {
      setShowDialog(false);
      setShowStartDateCalendar(false);
      setShowDueDateCalendar(false);

      await utils.request.getByCompany.invalidate();
      form.reset();

      return toast.success(t("create_request_sucess_title"), {
        description: t("create_request_sucess_description", { id: data.id }),
        position: "bottom-right",
        dismissible: true,
      });
    },
    onError: (error) => {
      console.error("Failed to create request:", error);
      return toast.error(t("create_request_error_title"), {
        description: t("create_request_error_description"),
        position: "bottom-right",
        dismissible: true,
      });
    },
  });

  return (
    <Drawer direction="right" open={showDialog} onOpenChange={setShowDialog}>
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
            className="flex flex-grow flex-col space-y-4 px-4 py-6"
            onSubmit={form.handleSubmit(async (data) => {
              const filesToProcess = data.attachments ?? [];

              const attachmentsWithBase64 = await Promise.all(
                filesToProcess.map(async (file) => ({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  base64: await fileToBase64(file),
                })),
              );

              const payload: z.infer<typeof createRequestTRPCSchema> = {
                ...data,
                attachments: attachmentsWithBase64,
              };

              await createRequestMutation.mutateAsync(payload);
            })}
          >
            <div className="flex flex-1 flex-grow flex-col space-y-4">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("summary")}*</FormLabel>

                    <FormControl>
                      <Input
                        id="summary"
                        placeholder="e.g. Legal request"
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
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due date</FormLabel>

                    <Popover
                      open={showDueDateCalendar}
                      onOpenChange={setShowDueDateCalendar}
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
                          selected={field.value}
                          defaultMonth={
                            form.getValues("startDate") ?? field.value
                          }
                          onSelect={(e) => {
                            field.onChange(e);
                            setShowDueDateCalendar(false);
                          }}
                          disabled={(date) =>
                            date < (form.getValues("startDate") ?? today)
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      This will be the displayed request due date
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="attachments"
                render={({ field: { value, onChange, name } }) => (
                  <FormItem>
                    <FormLabel className="gap-1">
                      {t("attachments")}{" "}
                      <span className="text-muted-foreground text-xs">
                        {value?.length && value.length > 0
                          ? `(${value.length})`
                          : ""}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <FileDropzone
                        value={value}
                        onChange={onChange}
                        name={name}
                        maxFileSize={MAX_FILE_SIZE}
                        acceptedFileTypes={ACCEPTED_FILE_TYPES}
                        maxFiles={MAX_FILES_COUNT}
                      />
                    </FormControl>
                    <FormDescription>
                      {t("create_request_attachments_form_description", {
                        files: MAX_FILES_COUNT,
                      })}
                    </FormDescription>
                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="p-0">
              <Button
                disabled={
                  !form.formState.isValid || createRequestMutation.isPending
                }
                type="submit"
              >
                {createRequestMutation.isPending ? <Spinner /> : t("create")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
