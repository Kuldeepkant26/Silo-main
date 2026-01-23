import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-black text-white">
      <div className="w-full max-w-full mx-auto px-[clamp(1rem,2.5vw,1.5rem)] py-[clamp(2.5rem,5vw,4rem)] pb-[clamp(1.25rem,3vw,2rem)]">
        {/* Main Footer Content */}
        <div className="flex gap-[clamp(1.5rem,4vw,3.5rem)] pb-[clamp(1.5rem,4vw,3rem)] border-b border-white/10 max-[1024px]:flex-col">
          {/* Brand Column */}
          <div className="max-w-[min(18rem,28%)] flex-shrink-0 max-[1024px]:max-w-full">
            <Link href="/" className="inline-flex items-center gap-[clamp(0.5rem,1vw,0.625rem)] mb-[clamp(1rem,2vw,1.5rem)] no-underline">
              <span className="text-[clamp(1.25rem,2vw,1.5rem)] font-bold text-white tracking-[0.08em]">
                SILO
              </span>
            </Link>
            <p className="text-[clamp(0.8125rem,calc(1.2vw+0.2rem),0.9375rem)] leading-[1.7] text-white/70 mb-[clamp(1.25rem,3vw,2rem)]">
              Automate your legal consultancies for business success. Scale your team&apos;s impact with the SILO AI Agent.
            </p>
            <div className="flex gap-[clamp(0.75rem,1.5vw,1rem)]">
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="flex items-center justify-center w-[clamp(2.25rem,4vw,2.75rem)] h-[clamp(2.25rem,4vw,2.75rem)] bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-white hover:text-black hover:-translate-y-[3px]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="flex items-center justify-center w-[clamp(2.25rem,4vw,2.75rem)] h-[clamp(2.25rem,4vw,2.75rem)] bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-white hover:text-black hover:-translate-y-[3px]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex items-center justify-center w-[clamp(2.25rem,4vw,2.75rem)] h-[clamp(2.25rem,4vw,2.75rem)] bg-white/10 rounded-full text-white transition-all duration-300 hover:bg-white hover:text-black hover:-translate-y-[3px]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-4 gap-[clamp(1.25rem,3vw,2.5rem)] flex-1 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1">
            {/* Products */}
            <div>
              <h4 className="text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-bold tracking-[0.1em] text-white mb-[clamp(1rem,2vw,1.5rem)] uppercase">
                PRODUCTS
              </h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/products/legal-requests" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Legal Requests
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/products/ai-agent" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    SILO AI Agent
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/products/contract-management" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Contract Management
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/products/compliance" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Compliance Hub
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/products/integrations" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-bold tracking-[0.1em] text-white mb-[clamp(1rem,2vw,1.5rem)] uppercase">
                SOLUTIONS
              </h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/solutions/enterprise" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Enterprise
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/solutions/startups" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Startups
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/solutions/law-firms" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Law Firms
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/solutions/in-house" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    In-House Teams
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-bold tracking-[0.1em] text-white mb-[clamp(1rem,2vw,1.5rem)] uppercase">
                RESOURCES
              </h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/resources/documentation" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Documentation
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/resources/blog" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Blog
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/resources/case-studies" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Case Studies
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/resources/webinars" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Webinars
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/resources/api" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    API Reference
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-bold tracking-[0.1em] text-white mb-[clamp(1rem,2vw,1.5rem)] uppercase">
                COMPANY
              </h4>
              <ul className="list-none p-0 m-0">
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/about" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    About Us
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/careers" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Careers
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/contact" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Contact
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/press" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Press
                  </Link>
                </li>
                <li className="mb-[clamp(0.625rem,1.2vw,0.875rem)]">
                  <Link href="/partners" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 relative hover:text-white after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1px] after:bg-white after:transition-all after:duration-300 hover:after:w-full">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex justify-between items-center pt-[clamp(1.25rem,3vw,2rem)] gap-4 flex-wrap max-[768px]:flex-col max-[768px]:text-center">
          <div>
            <p className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70">
              &copy; {currentYear} SILO. All rights reserved.
            </p>
          </div>
          <div className="flex gap-[clamp(1rem,2vw,1.5rem)] flex-wrap max-[768px]:justify-center">
            <Link href="/privacy" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 hover:text-white">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 hover:text-white">
              Cookie Policy
            </Link>
            <Link href="/security" className="text-[clamp(0.75rem,calc(1vw+0.15rem),0.875rem)] text-white/70 no-underline transition-all duration-200 hover:text-white">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
