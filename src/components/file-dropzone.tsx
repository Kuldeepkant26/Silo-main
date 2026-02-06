import type { ChangeEvent, DragEvent } from "react";
import { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/utils";
import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE,
  MAX_FILES_COUNT,
} from "~/lib/validators/request";

import { Icons } from "./icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface FileDropzoneProps {
  value?: File[] | undefined;
  name?: string;
  onChange?: (files: File[]) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  placeholder?: string;
}

export function FileDropzone({
  value,
  name,
  onChange,
  maxFileSize = MAX_FILE_SIZE,
  acceptedFileTypes = ACCEPTED_FILE_TYPES,
  maxFiles = MAX_FILES_COUNT,
  placeholder = "file_dropzone_placeholder",
}: FileDropzoneProps) {
  const t = useTranslations();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const currentFiles = useMemo(() => {
    return Array.isArray(value) ? value : [];
  }, [value]);

  const handleFileValidation = useCallback(
    (files: File[]): File[] => {
      const validFiles: File[] = [];
      const validationErrors: string[] = [];

      files.forEach((file) => {
        let fileIsValid = true;

        if (file.size > maxFileSize) {
          validationErrors.push(
            t("file_dropzone_size_error", {
              filename: file.name,
              size: maxFileSize / (1024 * 1024),
            }),
          );
          fileIsValid = false;
        }

        if (!acceptedFileTypes.includes(file.type)) {
          validationErrors.push(
            t("file_dropzone_type_error", { filename: file.name }),
          );
          fileIsValid = false;
        }

        if (fileIsValid) {
          validFiles.push(file);
        }
      });

      const potentialNewTotal = currentFiles.length + validFiles.length;
      if (potentialNewTotal > maxFiles) {
        validationErrors.push(t("file_dropzone_files_error", { maxFiles }));
        const filesToAddCount = maxFiles - currentFiles.length;
        if (filesToAddCount < validFiles.length) {
          validFiles.splice(filesToAddCount);
        }
      }

      if (validationErrors.length > 0) {
        setError(validationErrors.join(" "));
      } else {
        setError(undefined);
      }

      return validFiles;
    },
    [maxFileSize, acceptedFileTypes, maxFiles, currentFiles, t],
  );

  const addFiles = useCallback(
    (newFiles: File[]) => {
      const validatedNewFiles = handleFileValidation(newFiles);
      if (validatedNewFiles.length > 0) {
        const uniqueFiles = [...currentFiles];
        validatedNewFiles.forEach((newFile) => {
          if (
            !uniqueFiles.some(
              (existingFile) =>
                existingFile.name === newFile.name &&
                existingFile.size === newFile.size,
            )
          ) {
            uniqueFiles.push(newFile);
          }
        });

        if (onChange) onChange(uniqueFiles.slice(0, maxFiles));
      }
    },
    [currentFiles, onChange, handleFileValidation, maxFiles],
  );
    
  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);

      addFiles(selectedFiles);

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const droppedFiles = Array.from(event.dataTransfer.files || []);

      addFiles(droppedFiles);
    },
    [addFiles],
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRemoveFile = useCallback(
    (fileToRemove: File) => {
      const updatedFiles = currentFiles.filter((file) => file !== fileToRemove);
      if (onChange) onChange(updatedFiles);

      setError(undefined);
    },
    [currentFiles, onChange],
  );
                    
  return (
    <div
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[82px] w-full flex-col items-center justify-center rounded-md border border-dashed p-2 text-sm text-gray-500 shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        {
          "border-primary": isDragging,
        },
      )}
      style={{
        minHeight: currentFiles.length
          ? `calc(82px + 32px * ${currentFiles.length})`
          : "82px",
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Input
        aria-label={t(placeholder)}
        className="hidden"
        ref={fileInputRef}
        multiple={maxFiles < 1}
        name={name}
        onChange={handleFileChange}
        type="file"
      />

      <div className="flex min-h-14 items-center justify-center gap-x-2 py-3">
        <Icons.upload
          className={cn("text-foreground h-4 w-4 font-bold", {
            "text-primary h-6 w-6": isDragging,
          })}
        />
        {!isDragging && (
          <Fragment>
            <p className="text-muted-foreground">{t(placeholder)}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              {t("browse")}
            </Button>
          </Fragment>
        )}
      </div>

      {currentFiles.length > 0 && (
        <div className="w-full space-y-2">
          {currentFiles.map((file, index) => (
            <div
              key={`${file.name}-${file.lastModified}-${index}`}
              className="bg-muted text-accent-foreground flex items-center justify-between rounded-md px-3 py-1 shadow-sm"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Icons.file className="h-3 w-3" />
                <span className="truncate text-xs">{file.name}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(file);
                }}
                className="text-destructive hover:text-destructive-foreground !px-0"
              >
                <Icons.close className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center space-x-2">
          <Icons.warning className="text-destructive h-4 w-4" />
          <p className="text-destructive text-xs">{error}</p>
        </div>
      )}
    </div>
  );
}