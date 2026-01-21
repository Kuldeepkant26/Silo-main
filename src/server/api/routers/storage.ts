// ~/server/api/routers/upload.ts
import { z } from "zod";

import { supabaseAdmin } from "~/lib/supabase";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const storageRouter = createTRPCRouter({
  uploadProfileImage: protectedProcedure
    .input(
      z.object({
        file: z.string(),
        fileName: z.string(),
        fileType: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { file, fileName, fileType } = input;
      const userId = ctx.session.user.id;

      try {
        const base64Data = file.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        const timestamp = Date.now();
        const fileExtension = fileName.split(".").pop();
        const uniqueFileName = `${userId}/${timestamp}.${fileExtension}`;

        const { data, error } = await supabaseAdmin.storage
          .from("profile-images")
          .upload(uniqueFileName, buffer, {
            contentType: fileType,
            upsert: true,
          });

        if (error) {
          console.error("Supabase upload error:", error);
          throw new Error(`Upload failed: ${error.message}`);
        }

        console.log("Upload successful:", data);

        const { data: publicUrlData } = supabaseAdmin.storage
          .from("profile-images")
          .getPublicUrl(uniqueFileName);

        return {
          url: publicUrlData.publicUrl,
          path: data.path,
        };
      } catch (error) {
        console.error("Upload mutation error:", error);
        throw new Error(
          `Failed to upload image: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }),
});
