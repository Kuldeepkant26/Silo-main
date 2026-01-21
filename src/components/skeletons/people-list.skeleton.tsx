import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function PeopleListSkeleton() {
  return (
    <div className="w-full">
      <div className="flex w-fit min-w-56 items-center py-4">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>

      <Table className="w-full">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-6 w-24 rounded-full" />
            </TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell className="flex justify-end pr-4">
              <Skeleton className="h-6 w-8 rounded-full" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell className="flex justify-end pr-4">
              <Skeleton className="h-6 w-8 rounded-full" />
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-6 w-48 rounded-full" />
            </TableCell>
            <TableCell className="flex justify-end pr-4">
              <Skeleton className="h-6 w-8 rounded-full" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          <Skeleton className="h-5 w-32 rounded-full" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
        </div>
      </div>
    </div>
  );
}
