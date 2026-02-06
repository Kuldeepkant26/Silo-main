"use client";

import { useTranslations } from "next-intl";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ReviewBulkEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
}

const mockOwners = [
  {
    id: "1",
    name: "Aiyana Moorhead",
    avatar: "",
  },
  {
    id: "2",
    name: "Carlos Andres Cutillas",
    avatar: "",
  },
];

export function ReviewBulkEditModal({
  open,
  onOpenChange,
  selectedCount,
}: ReviewBulkEditModalProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{t("bulk_edit")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Legal Owner */}
          <div>
            <label className="text-lg font-bold text-foreground block mb-3">
              {t("legal_owner")}
            </label>
            <Select>
              <SelectTrigger className="w-full rounded-lg border-[#ccc]">
                <SelectValue placeholder="" />
              </SelectTrigger>
              <SelectContent>
                {mockOwners.map((owner) => (
                  <SelectItem key={owner.id} value={owner.id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={owner.avatar} />
                        <AvatarFallback className="text-xs">
                          {owner.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{owner.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Change Priority */}
          <div>
            <label className="text-lg font-bold text-foreground block mb-3">
              {t("change_priority")}
            </label>
            <Select>
              <SelectTrigger className="w-full rounded-lg border-[#ccc]">
                <SelectValue placeholder="HIGH , MID , LOW" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="MID">MID</SelectItem>
                <SelectItem value="LOW">LOW</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div>
            <label className="text-lg font-bold text-foreground block mb-3">
              {t("status")}
            </label>
            <Select>
              <SelectTrigger className="w-full rounded-lg border-[#ccc]">
                <SelectValue placeholder="DONE, OVERDUE, REOPEN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DONE">DONE</SelectItem>
                <SelectItem value="OVERDUE">OVERDUE</SelectItem>
                <SelectItem value="REOPEN">REOPEN</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}










