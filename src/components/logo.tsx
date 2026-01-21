"use client";

import Image from "next/image";

interface LogoProps {
  width: number;
  height: number;
  className?: string;
}

export function Logo({ width, height, className }: LogoProps) {
  return (
    <Image
      src="/silo.svg"
      alt="Silo logo"
      width={width}
      height={height}
      className={className}
    />
  );
}
