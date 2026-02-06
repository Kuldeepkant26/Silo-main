"use client";

import type { ChangeEvent } from "react";
import type z from "zod";
import { Fragment, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { getInitials } from "~/lib/utils";
import { profileFormSchema } from "~/lib/validators/profile";
import { authClient } from "~/server/auth/client";
import { api } from "~/trpc/react";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Separator } from "./ui/separator";

export function UserAccountProfile() {
  const { data: session } = authClient.useSession();

  const t = useTranslations();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | undefined>(
    session?.user?.image ?? undefined,
  );
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const uploadImageMutation = api.storage.uploadProfileImage.useMutation();

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: session?.user?.name ?? "",
      image: undefined,
    },
  });

  const watchedName = profileForm.watch("name");
  const watchedImage = profileForm.watch("image");

  useEffect(() => {
    const nameChanged = watchedName !== (session?.user?.name ?? "");
    const imageChanged = !!watchedImage;
    setHasChanges(nameChanged || imageChanged);
  }, [watchedName, watchedImage, session?.user?.name]);

  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    setIsLoading(true);

    try {
      let imageUrl = session?.user?.image;

      if (data.image) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(data.image!);
        });

        const uploadResult = await uploadImageMutation.mutateAsync({
          file: base64,
          fileName: data.image.name,
          fileType: data.image.type,
        });

        imageUrl = uploadResult.url;
      }

      const { error } = await authClient.updateUser({
        name: data.name,
        image: imageUrl,
      });

      if (error) {
        console.error("Auth update error:", error);
        toast.error(t("error"), {
          description: t("account_profile_error_description"),
        });
        return;
      }

      toast.success(t("account_profile_success_title"), {
        description: t("account_profile_success_description"),
      });

      profileForm.reset({
        name: data.name,
        image: undefined,
      });

      if (imageUrl) {
        setProfileImage(imageUrl);
      }

      setHasChanges(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error(t("error"), {
        description:
          error instanceof Error ? error.message : t("generic_error"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const result = profileFormSchema.shape.image.safeParse(file);

      if (!result.success) {
        toast.error(t("file_validation_error"), {
          description: result.error.errors[0]?.message,
        });
        profileForm.setValue("image", undefined);
        return;
      }

      profileForm.setValue("image", file);

      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">{t("profile_information")}</CardTitle>
        <CardDescription>
          {t("profile_information_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...profileForm}>
          <form
            onSubmit={profileForm.handleSubmit(onProfileSubmit)}
            className="space-y-6"
          >
            <div className="bg-muted/30 flex items-start gap-6 rounded-lg p-6">
              <div className="flex items-center gap-4">
                <Avatar className="ring-primary h-20 w-20 ring-2">
                  <AvatarImage
                    className="object-cover"
                    src={profileImage}
                    alt={t("profile")}
                  />
                  <AvatarFallback className="text-primary bg-transparent text-xl">
                    {getInitials(profileForm.watch("name"))}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      document.getElementById("avatar-upload")?.click()
                    }
                    className="flex items-center gap-2"
                  >
                    <Icons.camera className="h-4 w-4" />
                    {t("change_photo")}
                  </Button>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <p className="text-muted-foreground text-xs">
                    {t("change_photo_disclaimer")}
                  </p>
                  <FormMessage>
                    {profileForm.formState.errors.image?.message}
                  </FormMessage>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("name")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          {...field} 
                          readOnly={!isEditingName}
                          className={!isEditingName ? "pr-10 cursor-default bg-muted/30" : "pr-10"}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setIsEditingName(!isEditingName)}
                        >
                          {isEditingName ? (
                            <Icons.circleCheck className="h-4 w-4" />
                          ) : (
                            <Icons.edit className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage className="-mt-2" />
                  </FormItem>
                )}
              />

              <FormItem className="mb-2 cursor-not-allowed">
                <FormLabel className="text-muted-foreground">
                  {t("email")}
                </FormLabel>
                <Input disabled type="email" value={session?.user?.email} />
              </FormItem>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={
                  isLoading || !hasChanges || uploadImageMutation.isPending
                }
                className="min-w-32"
              >
                {isLoading || uploadImageMutation.isPending ? (
                  <Spinner />
                ) : (
                  <Fragment>
                    <Icons.checkCircle className="h-4 w-4" />
                    {t("save_profile")}
                  </Fragment>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
