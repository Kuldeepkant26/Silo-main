import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export function TeamsListSkeleton() {
  return (
    <Table className="w-full">
      <TableCaption>
        <Skeleton className="h-4 w-52 rounded-full" />
      </TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>
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
          <TableCell className="flex justify-end pr-4">
            <Skeleton className="h-6 w-8 rounded-full" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
