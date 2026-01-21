import { z } from "zod";

export const preferencesFormSchema = z.object({
  language: z.enum(["en", "es", "ca"], {
    required_error: "Please select a language",
  }),
  theme: z.enum(["light", "dark"], {
    required_error: "Please select a theme",
  }),
});

export type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;
