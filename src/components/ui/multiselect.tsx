"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "~/lib/utils";

import { Badge } from "./badge";
import { Button } from "./button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface Option<T> {
  label: string;
  value: T;
}

interface MultiSelectProps<T> {
  options: Option<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  placeholder?: string;
  isLoading?: boolean;
}

export function MultiSelect<T>({
  options,
  value,
  onChange,
  placeholder = "Select...",
  isLoading,
}: MultiSelectProps<T>) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedValue: T) => {
    const isSelected = value.includes(selectedValue);
    if (isSelected) {
      onChange(value.filter((val) => val !== selectedValue));
    } else {
      onChange([...value, selectedValue]);
    }
  };

  const selectedOptions = options.filter((option) =>
    value.includes(option.value),
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {isLoading ? (
            <span className="animate-pulse">{t("loading")}</span>
          ) : value.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1">
              {selectedOptions.map((option) => (
                <Badge
                  key={option.label}
                  variant="secondary"
                  className="rounded-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(option.value);
                  }}
                >
                  {option.label}
                  <div className="ml-1 text-xs opacity-50 hover:opacity-100">
                    <XIcon className="h-2 w-2" />
                  </div>
                </Badge>
              ))}
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={t("search")} />
          <CommandEmpty>{t("no_results")}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.label}
                value={option.label}
                onSelect={() => handleSelect(option.value)}
              >
                <CheckIcon
                  className={cn(
                    "mr-2 h-4 w-4",
                    value.includes(option.value) ? "opacity-100" : "opacity-0",
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
