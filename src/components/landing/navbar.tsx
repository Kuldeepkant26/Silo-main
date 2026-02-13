"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "~/server/auth/client";

interface NavbarProps {
  onGetStartedClick?: () => void;
}

export function Navbar({ onGetStartedClick }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: auth, isPending } = authClient.useSession();
  const isLoggedIn = !!auth?.session?.id;

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);
  
  // Get user initials from name
  const getUserInitials = () => {
    const name = auth?.user?.name || "";
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
    }
    return (parts[0]?.[0] || "U").toUpperCase();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] w-full backdrop-blur-md bg-white/80 border-b border-white/20">
      <div className="w-full max-w-full mx-auto px-[clamp(1.25rem,3vw,2.5rem)] h-[clamp(3.5rem,5vw,4.5rem)] flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center">
            <Image
              src="/Silomainlogo.png"
              alt="SILO"
              width={100}
              height={40}
              className="h-[clamp(2rem,3.5vw,2.5rem)] w-auto"
            />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden min-[769px]:flex items-center gap-[clamp(1.5rem,4vw,3rem)] flex-1 justify-center ml-[clamp(2rem,5vw,3.75rem)]">
          <Link
            href="/products"
            className="text-[clamp(0.75rem,calc(1vw+0.2rem),0.875rem)] font-semibold tracking-[0.03em] text-black relative whitespace-nowrap hover:opacity-100 after:content-[''] after:absolute after:bottom-[-6px] after:left-1/2 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-black after:via-[#333] after:to-black after:-translate-x-1/2 after:transition-all after:duration-[0.4s] after:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] after:rounded-[2px] hover:after:w-full"
          >
            PRODUCTS
          </Link>
          <Link
            href="/solutions"
            className="text-[clamp(0.75rem,calc(1vw+0.2rem),0.875rem)] font-semibold tracking-[0.03em] text-black relative whitespace-nowrap hover:opacity-100 after:content-[''] after:absolute after:bottom-[-6px] after:left-1/2 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-black after:via-[#333] after:to-black after:-translate-x-1/2 after:transition-all after:duration-[0.4s] after:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] after:rounded-[2px] hover:after:w-full"
          >
            SOLUTIONS
          </Link>
          <Link
            href="/resources"
            className="text-[clamp(0.75rem,calc(1vw+0.2rem),0.875rem)] font-semibold tracking-[0.03em] text-black relative whitespace-nowrap hover:opacity-100 after:content-[''] after:absolute after:bottom-[-6px] after:left-1/2 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-black after:via-[#333] after:to-black after:-translate-x-1/2 after:transition-all after:duration-[0.4s] after:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] after:rounded-[2px] hover:after:w-full"
          >
            RESOURCES
          </Link>
          <a
            href="#pricing"
            className="text-[clamp(0.75rem,calc(1vw+0.2rem),0.875rem)] font-semibold tracking-[0.03em] text-black relative whitespace-nowrap hover:opacity-100 after:content-[''] after:absolute after:bottom-[-6px] after:left-1/2 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-black after:via-[#333] after:to-black after:-translate-x-1/2 after:transition-all after:duration-[0.4s] after:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] after:rounded-[2px] hover:after:w-full"
          >
            PRICING
          </a>
        </div>

        {/* Desktop Right Side Actions */}
        <div className="hidden min-[769px]:flex items-center gap-[clamp(1rem,2vw,1.5rem)] flex-shrink-0">
          {isPending ? (
            <div className="w-[120px] h-[40px]" />
          ) : isLoggedIn ? (
            <div className="flex items-center gap-[clamp(0.75rem,1.5vw,1rem)]">
              <Link
                href="/requests"
                className="bg-black text-white px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.625rem,1.2vw,0.75rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.05em] rounded-full transition-all duration-300 whitespace-nowrap hover:bg-[#333] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              >
                VIEW DASHBOARD
              </Link>
              <Link
                href="/account?t=profile"
                className="w-[clamp(2.25rem,4vw,2.75rem)] h-[clamp(2.25rem,4vw,2.75rem)] rounded-full bg-white border-2 border-[#1a1a1a] flex items-center justify-center text-[clamp(0.75rem,1.2vw,0.875rem)] font-semibold text-[#1a1a1a] transition-all duration-300 hover:bg-[#1a1a1a] hover:text-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] cursor-pointer"
                title="View Profile"
              >
                {getUserInitials()}
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-[clamp(0.75rem,calc(1vw+0.2rem),0.875rem)] font-semibold tracking-[0.03em] text-black whitespace-nowrap relative hover:opacity-100 after:content-[''] after:absolute after:bottom-[-6px] after:left-1/2 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-black after:via-[#333] after:to-black after:-translate-x-1/2 after:transition-all after:duration-[0.4s] after:ease-[cubic-bezier(0.25,0.46,0.45,0.94)] after:rounded-[2px] hover:after:w-full"
              >
                LOG IN
              </Link>
              <button
                onClick={onGetStartedClick}
                className="bg-black text-white px-[clamp(1.25rem,2.5vw,2rem)] py-[clamp(0.625rem,1.2vw,0.75rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.05em] rounded-full transition-all duration-300 whitespace-nowrap hover:bg-[#333] hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]"
              >
                GET STARTED
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleMenu}
          className="hidden max-[768px]:block bg-transparent border-none cursor-pointer p-[clamp(0.375rem,1vw,0.5rem)] relative w-[clamp(1.75rem,3vw,2rem)] h-[clamp(1.75rem,3vw,2rem)] z-[1001]"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          <span
            className={`block w-[clamp(1.25rem,2vw,1.5rem)] h-[2px] bg-black relative transition-all duration-300 before:content-[''] before:absolute before:w-[clamp(1.25rem,2vw,1.5rem)] before:h-[2px] before:bg-black before:transition-transform before:duration-300 before:top-[-7px] after:content-[''] after:absolute after:w-[clamp(1.25rem,2vw,1.5rem)] after:h-[2px] after:bg-black after:transition-transform after:duration-300 after:bottom-[-7px] ${
              isMenuOpen
                ? "bg-transparent before:rotate-45 before:top-0 after:-rotate-45 after:bottom-0"
                : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-[998] min-[769px]:hidden"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Menu Panel */}
      <div
        className={`fixed top-[clamp(3.5rem,5vw,4.5rem)] left-0 right-0 bottom-0 bg-white z-[999] flex flex-col min-[769px]:hidden transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto px-6 pt-6 pb-8">
          {/* Mobile Nav Links */}
          <div className="flex flex-col gap-1">
            <Link
              href="/products"
              onClick={closeMenu}
              className="text-base font-semibold tracking-[0.03em] text-black py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              PRODUCTS
            </Link>
            <Link
              href="/solutions"
              onClick={closeMenu}
              className="text-base font-semibold tracking-[0.03em] text-black py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              SOLUTIONS
            </Link>
            <Link
              href="/resources"
              onClick={closeMenu}
              className="text-base font-semibold tracking-[0.03em] text-black py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              RESOURCES
            </Link>
            <a
              href="#pricing"
              onClick={closeMenu}
              className="text-base font-semibold tracking-[0.03em] text-black py-3 px-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              PRICING
            </a>
          </div>

          {/* Mobile Actions */}
          <div className="mt-auto pt-6 border-t border-gray-200 flex flex-col gap-3">
            {isPending ? (
              <div className="h-[48px]" />
            ) : isLoggedIn ? (
              <>
                <Link
                  href="/requests"
                  onClick={closeMenu}
                  className="bg-black text-white px-6 py-3.5 text-sm font-semibold tracking-[0.05em] rounded-full transition-all duration-300 text-center hover:bg-[#333]"
                >
                  VIEW DASHBOARD
                </Link>
                <Link
                  href="/account?t=profile"
                  onClick={closeMenu}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-[#1a1a1a] border-2 border-[#1a1a1a] rounded-full transition-all duration-300 hover:bg-[#1a1a1a] hover:text-white"
                >
                  <span className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold">
                    {getUserInitials()}
                  </span>
                  View Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="text-center px-6 py-3.5 text-sm font-semibold tracking-[0.03em] text-black border-2 border-black rounded-full hover:bg-black hover:text-white transition-all duration-300"
                >
                  LOG IN
                </Link>
                <button
                  onClick={() => {
                    closeMenu();
                    onGetStartedClick?.();
                  }}
                  className="bg-black text-white px-6 py-3.5 text-sm font-semibold tracking-[0.05em] rounded-full transition-all duration-300 text-center hover:bg-[#333]"
                >
                  GET STARTED
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
