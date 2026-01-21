"use client";

import { Fragment } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api } from "~/trpc/react";

import { Icons } from "./icons";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface RequestDetailsProps {
  id: string;
}

export function RequestDetails({ id }: RequestDetailsProps) {
  const router = useRouter();
  const t = useTranslations();

  const [request] = api.request.getById.useSuspenseQuery({ id });

  if (!request) {
    toast.error("Request not found");
    router.push("/requests");
    return;
  }

  return (
    <div className="px-3">
      <h1 className="text-2xl font-bold">{request.summary}</h1>
      <div className="text-muted-foreground flex items-center gap-x-2 text-xs">
        <div className="flex items-center gap-x-1">
          <Icons.calendarRange className="text-primary h-3 w-3" />
          {request.startDate && (
            <span>{format(request.startDate, "MMM dd")}</span>
          )}
          {request.startDate && request.dueDate && <span> - </span>}
          {request.dueDate && <span>{format(request.dueDate, "MMM dd")}</span>}
        </div>
        {request.attachments && request.attachments?.length > 0 ? (
          <Fragment>
            ·
            <div className="flex items-center gap-x-1">
              <Icons.files className="text-primary h-3 w-3" />
              <span>
                {request.attachments.length} {t("attachment_s")}
              </span>
            </div>
          </Fragment>
        ) : (
          ""
        )}
      </div>

      <Tabs className="mt-4 gap-y-4" defaultValue="discussion">
        <TabsList>
          <TabsTrigger value="discussion">Discussion</TabsTrigger>

          <TabsTrigger className="w-full" value="settings">
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent className="flex flex-col space-y-4" value="discussion">
          <Card className="py-6 shadow-none">
            <CardHeader>
              <CardTitle className="text-muted-foreground">
                Original request
              </CardTitle>
            </CardHeader>

            <CardContent className="text-sm">{request.description}</CardContent>
          </Card>

          <Card className="bg-primary/80 border-none py-6 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-x-2">
                Legal Team Bot
                <span className="text-foreground flex items-center gap-x-1 text-xs">
                  <Icons.ai className="h-3 w-3" />
                  Powered by AI
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent className="text-sm">
              This is a placeholder - as this feature is yet to be implemented.
              Here we will capture the outcome of our AI LLM (ChatGPT, Gemini,
              Claude...)
            </CardContent>

            <CardFooter className="mt-4 gap-x-2">
              <Button variant="secondary">
                <Icons.checkCircle className="h-4 w-4" />
                Use this response
              </Button>

              <Button variant="secondary">
                <Icons.edit className="h-4 w-4" />
                Edit this response
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent className="flex flex-col space-y-4" value="settings">
          TBD
        </TabsContent>
      </Tabs>
    </div>
  );
}
