"use client";

import type z from "zod";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { Tag } from "~/server/db/schema";
import { SEARCH_PARAM_TAG_ID, TAG_STATUS } from "~/config/settings";
import { editTagSchema } from "~/lib/validators/tag";
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
} from "./ui/drawer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface EditTagProps {
  tag: Tag;
  onOpenChange: (open: boolean) => void;
}

export function EditTag({ tag, onOpenChange }: EditTagProps) {
  const searchParams = useSearchParams();
  const tagId = searchParams.get(SEARCH_PARAM_TAG_ID);

  const t = useTranslations();
  const utils = api.useUtils();

  const [open, setOpen] = useState<boolean>(false);

  const { data: tagById } = api.tag.getById.useQuery(
    { id: tagId ?? "" },
    { enabled: !!tagId && !tag },
  );

  const currentTag = tag || tagById;

  const form = useForm<z.infer<typeof editTagSchema>>({
    resolver: zodResolver(editTagSchema),
    defaultValues: {
      name: currentTag.name ?? "",
      status: currentTag.status ?? "active",
    },
  });

  const { mutate: editTag, isPending } = api.tag.edit.useMutation({
    onSuccess: async () => {
      toast.success(t("edit_tag_success"));
      await utils.tag.getAllByOrganization.invalidate();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (currentTag) {
      form.reset({
        name: currentTag.name,
        status: currentTag.status,
      });
      setOpen(true);
    }
  }, [currentTag, form]);

  const onHandleSubmit = (values: z.infer<typeof editTagSchema>) => {
    if (currentTag) {
      editTag({
        id: currentTag.id,
        name: values.name,
        status: values.status,
      });
    }
  };

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="flex flex-col">
        <DrawerHeader>
          <DrawerClose>
            <Icons.close className="text-muted-foreground hover:text-primary h-4 w-4 cursor-pointer" />
          </DrawerClose>

          <DrawerTitle className="flex justify-center text-2xl">
            {tag?.name}
          </DrawerTitle>

          <DrawerDescription className="text-muted-foreground -mt-1 flex justify-center text-xs">
            {t("edit_tag_description")}
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form
            className="flex flex-grow flex-col space-y-4 px-4 py-6"
            onSubmit={form.handleSubmit(onHandleSubmit)}
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
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("status")}*</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={t("select_status")} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TAG_STATUS.map((tag) => (
                          <SelectItem key={tag.key} value={tag.value!}>
                            {t(tag.value!)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <DrawerFooter className="p-0">
              <Button disabled={isPending} type="submit">
                {isPending ? <Spinner /> : t("update")}
              </Button>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
