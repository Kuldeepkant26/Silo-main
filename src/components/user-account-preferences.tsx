import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import type { UiTheme } from "~/config/shared";
import type { Locale } from "~/i18n/config";
import type { PreferencesFormValues } from "~/lib/validators/preferences";
import { DEFAULT_LOCALE } from "~/i18n/config";
import { getLocaleFromCookie, setLocaleCookie } from "~/lib/locale";
import { preferencesFormSchema } from "~/lib/validators/preferences";

import { Icons } from "./icons";
import { Spinner } from "./spinner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

export function UserAccountPreferences() {
  const t = useTranslations();
  const { theme, setTheme } = useTheme();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);

  const initialValues: PreferencesFormValues = useMemo(
    () => ({
      language: (Cookies?.get("locale") ?? DEFAULT_LOCALE) as Locale,
      theme: theme as UiTheme,
    }),
    [theme],
  );

  const preferencesForm = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: initialValues,
  });

  const watchedValues = preferencesForm.watch();

  useEffect(() => {
    const hasFormChanges = Object.keys(initialValues).some(
      (key) =>
        watchedValues[key as keyof PreferencesFormValues] !==
        initialValues[key as keyof PreferencesFormValues],
    );
    setHasChanges(hasFormChanges);
  }, [watchedValues, initialValues]);

  const onPreferencesSubmit = async (data: PreferencesFormValues) => {
    setIsLoading(true);

    try {
      if (data.theme !== theme) {
        setTheme(data.theme);
      }

      if (data.language !== getLocaleFromCookie()) {
        setLocaleCookie(data.language);

        toast.success(t("account_preferences_success_title"), {
          description: t("account_preferences_language_success_description"),
        });

        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      toast.success(t("account_preferences_success_title"), {
        description: t("account_preferences_success_description"),
      });

      preferencesForm.reset(data);
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast.error(t("error"), {
        description: t("account_preferences_error_description"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">
          {t("application_preferences")}
        </CardTitle>
        <CardDescription>
          {t("application_preferences_description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...preferencesForm}>
          <form
            onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={preferencesForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Icons.language className="h-4 w-4" />
                      {t("language")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">{t("english")}</SelectItem>
                        <SelectItem value="es">{t("spanish")}</SelectItem>
                        <SelectItem value="ca">{t("catalan")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={preferencesForm.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("theme")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">{t("light")}</SelectItem>
                        <SelectItem value="dark">{t("dark")}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* <Separator />

            <div className="space-y-4">
              <h3 className="mb-1.5 flex items-center gap-2 text-lg font-medium">
                <Icons.bell className="h-5 w-5" />
                Notification Settings
              </h3>

              <p className="text-muted-foreground text-sm">Coming soon</p>
            </div> */}

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading || !hasChanges}
                className="min-w-32"
              >
                {isLoading ? (
                  <Spinner />
                ) : (
                  <>
                    <Icons.checkCircle className="h-4 w-4" />
                    {t("save_preferences")}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
