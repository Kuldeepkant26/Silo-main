import { Fragment } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

// TODO: Test this
export function RequestsListSkeleton() {
  return (
    <Fragment>
      {Array.from({ length: 4 }).map((_, idx) => (
        <Card key={idx} className="col-span-1 min-h-28 w-full">
          <CardHeader>
            <CardTitle>
              <Skeleton className="h-4 w-24 rounded-full" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-24 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </Fragment>
  );
}
