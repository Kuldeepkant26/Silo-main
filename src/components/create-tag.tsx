/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
"use client";

import type z from "zod";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createTagSchema } from "~/lib/validators/tag";
import { api } from "~/trpc/react";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Button } from "./ui/button";
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

export function CreateTag() {
  const t = useTranslations();
  const utils = api.useUtils();

  const [open, setOpen] = useState(false);

  const tagForm = useForm<z.infer<typeof createTagSchema>>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: "",
    },
  });

  const createTagMutation = api.tag.create.useMutation({
    onSuccess: async (data) => {
      toast.success(t("create_tag_success", { tagName: data?.name! }));
      await utils.tag.getAllByOrganization.invalidate();
      tagForm.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast.error(`${t("create_tag_error")}: ${error.message}`);
    },
  });

  const onHandleSubmit = async (data: z.infer<typeof createTagSchema>) => {
    try {
      await createTagMutation.mutateAsync(data);
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const onOpenChange = (newOpenState: boolean) => {
    setOpen(newOpenState);
    if (!newOpenState) {
      tagForm.reset();
    }
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>
        <Button className="min-w-28">{t("create_tag")}</Button>
      </DrawerTrigger>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>

          <DrawerTitle className="flex justify-center text-2xl">
            {t("create_tag")}
          </DrawerTitle>

          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("create_tag_description")}
          </DrawerDescription>
        </DrawerHeader>

        <Form {...tagForm}>
          <form
            className="flex flex-grow flex-col space-y-4 px-4 py-6"
            onSubmit={tagForm.handleSubmit(onHandleSubmit)}
          >
            <div className="flex flex-1 flex-grow flex-col space-y-4">
              <FormField
                control={tagForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}*</FormLabel>

                    <FormControl>
                      <Input
                        id="name"
                        placeholder="e.g. Product"
                        type="text"
                        required
                        autoFocus
                        {...field}
                      />
                    </FormControl>

                    <FormDescription>
                      {t("create_tag_name_form_description")}
                    </FormDescription>

                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="p-0">
              <Button
                disabled={
                  !tagForm.formState.isValid || createTagMutation.isPending
                }
                type="submit"
              >
                {createTagMutation.isPending ? <Spinner /> : t("create")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
