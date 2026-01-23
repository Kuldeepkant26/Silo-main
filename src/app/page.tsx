"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "~/components/landing/navbar";
import { Footer } from "~/components/landing/footer";
import { authClient } from "~/server/auth/client";

export default function Home() {
  const router = useRouter();
  const { data: auth } = authClient.useSession();
  const isLoggedIn = !!auth?.session?.id;
  
  const [isGetStartedModalOpen, setIsGetStartedModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companySize: "",
    country: "",
    hearAbout: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClear = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companySize: "",
      country: "",
      hearAbout: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setIsGetStartedModalOpen(false);
      router.push(`/register?email=${encodeURIComponent(email.trim())}`);
      setEmail("");
    }
  };

  return (
    <div className="w-full min-h-screen bg-white overflow-x-hidden">
      <Navbar onGetStartedClick={() => setIsGetStartedModalOpen(true)} />

      {/* Hero Section */}
      <section className="w-full max-w-full mx-auto px-[clamp(1rem,2.5vw,1.5rem)] pt-[clamp(7rem,12vw,10rem)] pb-[clamp(1.5rem,3vw,2rem)] flex flex-col items-center">
        <div className="text-center w-full max-w-[min(62.5rem,90%)] mb-[clamp(1.5rem,4vw,2.5rem)]">
          <h1 className="text-[clamp(1.5rem,calc(4vw+0.5rem),2.625rem)] font-bold tracking-[0.02em] leading-[1.15] text-black mb-[clamp(0.75rem,2vw,1.125rem)] uppercase">
            AUTOMATE YOUR LEGAL CONSULTANCIES FOR BUSINESS SUCCESS
          </h1>
          <p className="text-[clamp(0.875rem,calc(1.5vw+0.25rem),1.0625rem)] leading-[1.5] text-black w-full max-w-[min(53.125rem,95%)] mx-auto mb-[clamp(1.25rem,3vw,1.875rem)]">
            Smartly assign legal tasks to your team... reduce manual workload, respond faster
            with predefined answers, and scale your team&apos;s impact with the SILO AI Agent.
          </p>
          <div className="flex gap-[clamp(0.75rem,2vw,1.125rem)] justify-center items-center flex-wrap max-[768px]:flex-col max-[768px]:w-full max-[768px]:max-w-[min(18.75rem,90%)] max-[768px]:mx-auto">
            {isLoggedIn ? (
              <Link
                href="/requests"
                className="bg-black text-white px-[clamp(1.5rem,4vw,2.5rem)] py-[clamp(0.75rem,1.5vw,0.875rem)] text-[clamp(0.6875rem,calc(1vw+0.2rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase border-none rounded-full cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#333] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] max-[768px]:w-full text-center"
              >
                VIEW DASHBOARD
              </Link>
            ) : (
              <>
                <button
                  onClick={() => setIsGetStartedModalOpen(true)}
                  className="bg-black text-white px-[clamp(1.5rem,4vw,2.5rem)] py-[clamp(0.75rem,1.5vw,0.875rem)] text-[clamp(0.6875rem,calc(1vw+0.2rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase border-none rounded-full cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-[#333] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] max-[768px]:w-full"
                >
                  GET STARTED
                </button>
                <button className="bg-transparent text-black px-[clamp(1.5rem,4vw,2.5rem)] py-[clamp(0.75rem,1.5vw,0.875rem)] text-[clamp(0.6875rem,calc(1vw+0.2rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase border-2 border-black rounded-full cursor-pointer transition-all duration-300 whitespace-nowrap hover:bg-black hover:text-white hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] max-[768px]:w-full">
                  CONTACT SALES
                </button>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="w-full max-w-[min(62.5rem,95%)] mt-[clamp(1.25rem,3vw,1.875rem)]">
          <div className="flex bg-white rounded-[clamp(0.75rem,2vw,1rem)] shadow-[0_25px_80px_rgba(0,0,0,0.15)] overflow-hidden animate-[floatUp_0.8s_ease-out] border border-black/[0.08]">
            {/* Sidebar */}
            <div className="w-[clamp(8.75rem,15vw,11.25rem)] min-w-[8.75rem] bg-[#f8f9fb] pt-[clamp(1rem,2vw,1.25rem)] pb-[clamp(1rem,2vw,1.25rem)] border-r border-black/[0.06] flex-shrink-0 max-[900px]:hidden">
              <div className="flex items-center gap-[clamp(0.375rem,1vw,0.5rem)] px-[clamp(0.75rem,2vw,1.25rem)] pb-[clamp(1rem,2vw,1.5rem)] border-b border-black/[0.06] mb-[clamp(0.75rem,2vw,1rem)]">
                <span className="text-[clamp(1rem,2vw,1.25rem)] text-black">⬡</span>
                <span className="text-[clamp(0.875rem,1.5vw,1.125rem)] font-bold text-black tracking-[0.05em]">
                  SILO
                </span>
              </div>
              <nav className="flex flex-col gap-[clamp(0.125rem,0.5vw,0.25rem)]">
                <div className="flex items-center gap-[clamp(0.5rem,1vw,0.625rem)] px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.5rem,1vw,0.625rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] text-black bg-black/[0.06] font-medium cursor-pointer">
                  <span className="text-[clamp(0.75rem,1vw,0.875rem)] w-[clamp(1rem,1.5vw,1.125rem)] text-center">
                    ◫
                  </span>
                  <span>Dashboard</span>
                </div>
                <div className="flex items-center gap-[clamp(0.5rem,1vw,0.625rem)] px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.5rem,1vw,0.625rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] text-[#666] cursor-pointer transition-all duration-200 hover:text-black hover:bg-black/[0.04]">
                  <span className="text-[clamp(0.75rem,1vw,0.875rem)] w-[clamp(1rem,1.5vw,1.125rem)] text-center">
                    ☰
                  </span>
                  <span>Tickets</span>
                </div>
                <div className="flex items-center gap-[clamp(0.5rem,1vw,0.625rem)] px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.5rem,1vw,0.625rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] text-[#666] cursor-pointer transition-all duration-200 hover:text-black hover:bg-black/[0.04]">
                  <span className="text-[clamp(0.75rem,1vw,0.875rem)] w-[clamp(1rem,1.5vw,1.125rem)] text-center">
                    ◉
                  </span>
                  <span>Team</span>
                </div>
                <div className="flex items-center gap-[clamp(0.5rem,1vw,0.625rem)] px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.5rem,1vw,0.625rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] text-[#666] cursor-pointer transition-all duration-200 hover:text-black hover:bg-black/[0.04]">
                  <span className="text-[clamp(0.75rem,1vw,0.875rem)] w-[clamp(1rem,1.5vw,1.125rem)] text-center">
                    ▤
                  </span>
                  <span>Templates</span>
                </div>
                <div className="flex items-center gap-[clamp(0.5rem,1vw,0.625rem)] px-[clamp(0.75rem,2vw,1.25rem)] py-[clamp(0.5rem,1vw,0.625rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] text-[#666] cursor-pointer transition-all duration-200 hover:text-black hover:bg-black/[0.04]">
                  <span className="text-[clamp(0.75rem,1vw,0.875rem)] w-[clamp(1rem,1.5vw,1.125rem)] text-center">
                    ⚙
                  </span>
                  <span>Settings</span>
                </div>
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-[clamp(1rem,2vw,1.25rem)] px-[clamp(1rem,2.5vw,1.5rem)] bg-white overflow-hidden min-w-0">
              <div className="flex justify-between items-center mb-[clamp(1rem,2vw,1.25rem)] flex-wrap gap-2">
                <h3 className="text-[clamp(1rem,2vw,1.25rem)] font-semibold text-black">
                  Dashboard
                </h3>
                <button className="bg-black text-white px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.375rem,1vw,0.5rem)] border-none rounded-lg text-[clamp(0.625rem,1vw,0.75rem)] font-medium cursor-pointer transition-all duration-200 whitespace-nowrap hover:-translate-y-[1px] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]">
                  + New Ticket
                </button>
              </div>

              {/* Mini Stats */}
              <div className="grid grid-cols-4 gap-[clamp(0.5rem,1.5vw,0.75rem)] mb-[clamp(1rem,2vw,1.5rem)] max-[900px]:grid-cols-2">
                <div className="bg-[#f8f9fb] rounded-[clamp(0.5rem,1vw,0.625rem)] p-[clamp(0.625rem,1.5vw,0.875rem)] px-[clamp(0.75rem,1.5vw,1rem)] flex flex-col gap-[clamp(0.125rem,0.5vw,0.25rem)] transition-transform duration-300 hover:-translate-y-[2px]">
                  <span className="text-[clamp(0.5rem,calc(0.8vw+0.1rem),0.625rem)] text-[#666] uppercase tracking-[0.03em]">
                    Open Tickets
                  </span>
                  <span className="text-[clamp(0.875rem,2vw,1.25rem)] font-semibold text-black">
                    12
                  </span>
                  <span className="text-[clamp(0.5rem,calc(0.7vw+0.1rem),0.5625rem)] text-[#22c55e]">
                    +2 since yesterday
                  </span>
                </div>
                <div className="bg-[#f8f9fb] rounded-[clamp(0.5rem,1vw,0.625rem)] p-[clamp(0.625rem,1.5vw,0.875rem)] px-[clamp(0.75rem,1.5vw,1rem)] flex flex-col gap-[clamp(0.125rem,0.5vw,0.25rem)] transition-transform duration-300 hover:-translate-y-[2px]">
                  <span className="text-[clamp(0.5rem,calc(0.8vw+0.1rem),0.625rem)] text-[#666] uppercase tracking-[0.03em]">
                    Resolved Today
                  </span>
                  <span className="text-[clamp(0.875rem,2vw,1.25rem)] font-semibold text-black">
                    5
                  </span>
                  <span className="text-[clamp(0.5rem,calc(0.7vw+0.1rem),0.5625rem)] text-[#22c55e]">
                    +1 from yesterday
                  </span>
                </div>
                <div className="bg-[#f8f9fb] rounded-[clamp(0.5rem,1vw,0.625rem)] p-[clamp(0.625rem,1.5vw,0.875rem)] px-[clamp(0.75rem,1.5vw,1rem)] flex flex-col gap-[clamp(0.125rem,0.5vw,0.25rem)] transition-transform duration-300 hover:-translate-y-[2px]">
                  <span className="text-[clamp(0.5rem,calc(0.8vw+0.1rem),0.625rem)] text-[#666] uppercase tracking-[0.03em]">
                    Avg. Response Time
                  </span>
                  <span className="text-[clamp(0.875rem,2vw,1.25rem)] font-semibold text-black">
                    4.2 hours
                  </span>
                  <span className="text-[clamp(0.5rem,calc(0.7vw+0.1rem),0.5625rem)] text-[#22c55e]">
                    -20 min from last week
                  </span>
                </div>
                <div className="bg-[#f8f9fb] rounded-[clamp(0.5rem,1vw,0.625rem)] p-[clamp(0.625rem,1.5vw,0.875rem)] px-[clamp(0.75rem,1.5vw,1rem)] flex flex-col gap-[clamp(0.125rem,0.5vw,0.25rem)] transition-transform duration-300 hover:-translate-y-[2px]">
                  <span className="text-[clamp(0.5rem,calc(0.8vw+0.1rem),0.625rem)] text-[#666] uppercase tracking-[0.03em]">
                    Team Members
                  </span>
                  <span className="text-[clamp(0.875rem,2vw,1.25rem)] font-semibold text-black">
                    4
                  </span>
                  <span className="text-[clamp(0.5rem,calc(0.7vw+0.1rem),0.5625rem)] text-[#666]">
                    All active
                  </span>
                </div>
              </div>

              {/* Tickets Section */}
              <div className="bg-[#f8f9fb] rounded-[clamp(0.625rem,1.5vw,0.75rem)] p-[clamp(0.75rem,1.5vw,1rem)]">
                <div className="flex justify-between items-center mb-[clamp(0.75rem,1.5vw,1rem)] flex-wrap gap-2">
                  <h4 className="text-[clamp(0.75rem,1.2vw,0.875rem)] font-semibold text-black">
                    Recent Tickets
                  </h4>
                  <div className="flex gap-[clamp(0.5rem,1.5vw,1rem)]">
                    <span className="text-[clamp(0.5625rem,0.9vw,0.6875rem)] text-[#666] cursor-pointer transition-colors duration-200 hover:text-black">
                      Status
                    </span>
                    <span className="text-[clamp(0.5625rem,0.9vw,0.6875rem)] text-[#666] cursor-pointer transition-colors duration-200 hover:text-black">
                      Priority
                    </span>
                    <span className="text-[clamp(0.5625rem,0.9vw,0.6875rem)] text-[#666] cursor-pointer transition-colors duration-200 hover:text-black">
                      Category
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-[clamp(0.5rem,1.2vw,0.75rem)] max-[900px]:grid-cols-1">
                  <div className="bg-white rounded-[clamp(0.5rem,1vw,0.625rem)] p-[clamp(0.75rem,1.5vw,0.875rem)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] animate-[slideIn_0.6s_ease-out_0.2s_both]">
                    <div className="flex gap-[clamp(0.25rem,0.5vw,0.375rem)] mb-[clamp(0.375rem,0.8vw,0.5rem)] flex-wrap">
                      <span className="px-[clamp(0.375rem,0.8vw,0.5rem)] py-[clamp(0.125rem,0.3vw,0.1875rem)] rounded bg-[#fecaca] text-[#dc2626] text-[clamp(0.4375rem,calc(0.7vw+0.1rem),0.5625rem)] font-semibold uppercase tracking-[0.02em] whitespace-nowrap">
                        high
                      </span>
                      <span className="px-[clamp(0.375rem,0.8vw,0.5rem)] py-[clamp(0.125rem,0.3vw,0.1875rem)] rounded bg-black text-white text-[clamp(0.4375rem,calc(0.7vw+0.1rem),0.5625rem)] font-semibold uppercase tracking-[0.02em] whitespace-nowrap">
                        new
                      </span>
                    </div>
                    <h5 className="text-[clamp(0.625rem,calc(1vw+0.1rem),0.75rem)] font-semibold text-black mb-[clamp(0.25rem,0.6vw,0.375rem)] leading-[1.4]">
                      Review vendor contract for IT services
                    </h5>
                    <p className="text-[clamp(0.5rem,calc(0.8vw+0.1rem),0.625rem)] text-[#666] leading-[1.5] mb-[clamp(0.5rem,1vw,0.625rem)] line-clamp-2">
                      We need to review the new vendor contract for our IT service provider...
                    </p>
                    <div className="flex justify-between text-[clamp(0.4375rem,calc(0.7vw+0.1rem),0.5625rem)] text-[#999] flex-wrap gap-1">
                      <span>John Smith</span>
                      <span>contracts</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-[clamp(0.5rem,1vw,0.625rem)] p-[clamp(0.75rem,1.5vw,0.875rem)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-300 cursor-pointer hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)] animate-[slideIn_0.6s_ease-out_0.4s_both] max-[900px]:hidden">
                    <div className="flex gap-[clamp(0.25rem,0.5vw,0.375rem)] mb-[clamp(0.375rem,0.8vw,0.5rem)] flex-wrap">
                      <span className="px-[clamp(0.375rem,0.8vw,0.5rem)] py-[clamp(0.125rem,0.3vw,0.1875rem)] rounded bg-[#fef08a] text-[#ca8a04] text-[clamp(0.4375rem,calc(0.7vw+0.1rem),0.5625rem)] font-semibold uppercase tracking-[0.02em] whitespace-nowrap">
                        medium
                      </span>
                      <span className="px-[clamp(0.375rem,0.8vw,0.5rem)] py-[clamp(0.125rem,0.3vw,0.1875rem)] rounded bg-[#dbeafe] text-[#2563eb] text-[clamp(0.4375rem,calc(0.7vw+0.1rem),0.5625rem)] font-semibold uppercase tracking-[0.02em] whitespace-nowrap">
                        assigned
                      </span>
                    </div>
                    <h5 className="text-[clamp(0.625rem,calc(1vw+0.1rem),0.75rem)] font-semibold text-black mb-[clamp(0.25rem,0.6vw,0.375rem)] leading-[1.4]">
                      Question about employee stock options
                    </h5>
                    <p className="text-[clamp(0.5rem,calc(0.8vw+0.1rem),0.625rem)] text-[#666] leading-[1.5] mb-[clamp(0.5rem,1vw,0.625rem)] line-clamp-2">
                      I have questions about the vesting schedule for my employee stock options...
                    </p>
                    <div className="flex justify-between text-[clamp(0.4375rem,calc(0.7vw+0.1rem),0.5625rem)] text-[#999] flex-wrap gap-1">
                      <span>Alice Johnson</span>
                      <span>corporate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full max-w-full mx-auto px-[clamp(1rem,2.5vw,1.5rem)] py-[clamp(2.5rem,5vw,4rem)] bg-transparent">
        <h2 className="text-[clamp(1.25rem,calc(2.5vw+0.5rem),1.75rem)] font-bold tracking-[0.05em] text-center text-black mb-[clamp(2rem,5vw,3.75rem)] uppercase">
          TRUSTED BY +100 CUSTOMERS
        </h2>
        <div className="grid grid-cols-3 gap-[clamp(1rem,3vw,1.875rem)] w-full max-w-[min(75rem,100%)] mx-auto max-[1024px]:grid-cols-2 max-[768px]:grid-cols-1">
          <div className="bg-[#d1d5db] rounded-[clamp(1.25rem,3vw,2rem)] p-[clamp(2rem,5vw,3.75rem)] px-[clamp(1.25rem,4vw,2.5rem)] text-center transition-transform duration-300 hover:-translate-y-1 max-[1024px]:last:col-span-2 max-[1024px]:last:max-w-[min(31.25rem,100%)] max-[1024px]:last:w-full max-[1024px]:last:mx-auto max-[768px]:last:col-span-1 max-[768px]:last:max-w-full">
            <div className="text-[clamp(3rem,8vw,5.5rem)] font-normal leading-none text-black mb-[clamp(1rem,2vw,1.5rem)]">
              95%
            </div>
            <p className="text-[clamp(0.875rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.5] text-black max-w-full mx-auto">
              Of key obligations under management
            </p>
          </div>
          <div className="bg-[#d1d5db] rounded-[clamp(1.25rem,3vw,2rem)] p-[clamp(2rem,5vw,3.75rem)] px-[clamp(1.25rem,4vw,2.5rem)] text-center transition-transform duration-300 hover:-translate-y-1">
            <div className="text-[clamp(3rem,8vw,5.5rem)] font-normal leading-none text-black mb-[clamp(1rem,2vw,1.5rem)]">
              70%
            </div>
            <p className="text-[clamp(0.875rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.5] text-black max-w-full mx-auto">
              Contracts generated by self-service
            </p>
          </div>
          <div className="bg-[#d1d5db] rounded-[clamp(1.25rem,3vw,2rem)] p-[clamp(2rem,5vw,3.75rem)] px-[clamp(1.25rem,4vw,2.5rem)] text-center transition-transform duration-300 hover:-translate-y-1">
            <div className="text-[clamp(3rem,8vw,5.5rem)] font-normal leading-none text-black mb-[clamp(1rem,2vw,1.5rem)]">
              50%
            </div>
            <p className="text-[clamp(0.875rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.5] text-black max-w-full mx-auto">
              Reduction in time to review legal tasks
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full max-w-full mx-auto px-[clamp(1rem,2.5vw,1.5rem)] py-[clamp(2.5rem,5vw,4rem)] bg-white">
        <h2 className="text-[clamp(1.5rem,calc(3.5vw+0.5rem),2.625rem)] font-bold tracking-[0.02em] text-center text-black mb-[clamp(2rem,5vw,3.75rem)] uppercase">
          SAVE TIME AND MONEY WITH OUR PLANS
        </h2>
        <div className="grid grid-cols-3 gap-0 w-full max-w-[min(75rem,100%)] mx-auto bg-[#f5f5f5] rounded-[clamp(1rem,2vw,1.5rem)] overflow-hidden max-[1024px]:grid-cols-1">
          {/* Free Plan */}
          <div className="p-[clamp(1.5rem,4vw,3.125rem)] px-[clamp(1.25rem,3.5vw,2.5rem)] flex flex-col border-r border-black/[0.08] max-[1024px]:border-r-0 max-[1024px]:border-b max-[1024px]:last:border-b-0">
            <h3 className="text-[clamp(1.25rem,2.5vw,1.75rem)] text-black mb-[clamp(1rem,3vw,2rem)]">
              Free
            </h3>
            <ul className="list-disc pl-[clamp(1rem,2vw,1.25rem)] mb-auto flex-1">
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                1 account
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Access to data
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Create content
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Publish photos
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Publish videos
              </li>
            </ul>
            <button className="bg-transparent text-black px-[clamp(1.5rem,3vw,2.5rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase rounded-full cursor-pointer transition-all duration-300 text-center mt-[clamp(1rem,3vw,2rem)] border-2 border-black hover:bg-black hover:text-white">
              GET STARTED
            </button>
          </div>

          {/* Pro Plan */}
          <div className="p-[clamp(1.5rem,4vw,3.125rem)] px-[clamp(1.25rem,3.5vw,2.5rem)] flex flex-col border-r border-black/[0.08] max-[1024px]:border-r-0 max-[1024px]:border-b max-[1024px]:last:border-b-0">
            <h3 className="text-[clamp(1.25rem,2.5vw,2rem)] font-bold text-black mb-[clamp(1rem,3vw,2rem)]">
              25€
            </h3>
            <ul className="list-disc pl-[clamp(1rem,2vw,1.25rem)] mb-auto flex-1">
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Everything in Basic plan
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                5 accounts
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Personalized attention
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Monthly feedback
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Highlight your content
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Unlimited access
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Offers and discounts
              </li>
              <li className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.375rem,1vw,0.5rem)]">
                Enhanced security
              </li>
            </ul>
            <button className="bg-black text-white px-[clamp(1.5rem,3vw,2.5rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase rounded-full cursor-pointer transition-all duration-300 text-center mt-[clamp(1rem,3vw,2rem)] border-2 border-black hover:bg-[#333] hover:border-[#333] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
              TRY FOR FREE
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="p-[clamp(1.5rem,4vw,3.125rem)] px-[clamp(1.25rem,3.5vw,2.5rem)] flex flex-col">
            <h3 className="text-[clamp(1.25rem,2.5vw,1.75rem)] text-black mb-[clamp(1rem,3vw,2rem)] underline underline-offset-4">
              Contact
            </h3>
            <div className="flex-1 mb-[clamp(1rem,3vw,2rem)]">
              <p className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.75rem,1.5vw,1rem)]">
                All the features of previous plans plus the personalized features you need.
              </p>
              <p className="text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black leading-[1.6] mb-[clamp(0.75rem,1.5vw,1rem)]">
                A customized quote will be created adjusted to your business needs.
              </p>
            </div>
            <button className="bg-black text-white px-[clamp(1.5rem,3vw,2.5rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase rounded-full cursor-pointer transition-all duration-300 text-center mt-[clamp(1rem,3vw,2rem)] border-2 border-black hover:bg-[#333] hover:border-[#333] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
              BOOK A DEMO
            </button>
          </div>
        </div>
      </section>

      {/* Legal Requests Section */}
      <section className="w-full max-w-full mx-auto px-[clamp(1rem,2.5vw,1.5rem)] py-[clamp(2.5rem,5vw,4rem)] bg-white">
        <div className="flex items-center gap-[clamp(2rem,4vw,3rem)] w-full max-w-[min(75rem,100%)] mx-auto max-[1024px]:flex-col">
          <div className="flex-1 min-w-0 max-[1024px]:text-center max-[1024px]:pt-0">
            <h2 className="text-[clamp(1.5rem,calc(3.5vw+0.5rem),2.625rem)] font-bold tracking-[0.02em] leading-[1.15] text-black mb-[clamp(1.25rem,3vw,2rem)] uppercase">
              AN END-TO-END SOLUTION FOR LEGAL REQUESTS
            </h2>
            <ul className="list-none p-0 m-0 max-[1024px]:inline-block max-[1024px]:text-left max-[1024px]:max-w-[min(28.125rem,100%)]">
              <li className="relative pl-[clamp(1.25rem,2vw,1.5rem)] text-[clamp(0.9375rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.6] text-black mb-[clamp(0.75rem,1.5vw,1rem)] before:content-['•'] before:absolute before:left-0 before:text-[clamp(1.25rem,2vw,1.5rem)] before:leading-[1.2] before:text-black">
                Smartly assign legal tasks to your team...
              </li>
              <li className="relative pl-[clamp(1.25rem,2vw,1.5rem)] text-[clamp(0.9375rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.6] text-black mb-[clamp(0.75rem,1.5vw,1rem)] before:content-['•'] before:absolute before:left-0 before:text-[clamp(1.25rem,2vw,1.5rem)] before:leading-[1.2] before:text-black">
                Reduce manual workload
              </li>
              <li className="relative pl-[clamp(1.25rem,2vw,1.5rem)] text-[clamp(0.9375rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.6] text-black mb-[clamp(0.75rem,1.5vw,1rem)] before:content-['•'] before:absolute before:left-0 before:text-[clamp(1.25rem,2vw,1.5rem)] before:leading-[1.2] before:text-black">
                Respond faster with predefined answers
              </li>
              <li className="relative pl-[clamp(1.25rem,2vw,1.5rem)] text-[clamp(0.9375rem,calc(1.5vw+0.25rem),1.125rem)] leading-[1.6] text-black mb-[clamp(0.75rem,1.5vw,1rem)] before:content-['•'] before:absolute before:left-0 before:text-[clamp(1.25rem,2vw,1.5rem)] before:leading-[1.2] before:text-black">
                Scale your legal team&apos;s impact with the SILO AI Agent.
              </li>
            </ul>
          </div>

          <div className="flex-1 w-full max-w-[min(32.5rem,50%)] bg-[#d1d5db] rounded-[clamp(1rem,2vw,1.5rem)] p-[clamp(1.5rem,3.5vw,2.5rem)] max-[1024px]:max-w-full">
            <form onSubmit={handleSubmit} className="flex flex-col gap-[clamp(0.75rem,1.5vw,1rem)]">
              <div className="flex gap-[clamp(0.75rem,1.5vw,1rem)] max-[768px]:flex-col">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name*"
                    className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name*"
                    className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
                    required
                  />
                </div>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Work email*"
                className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
                required
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number*"
                className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
                required
              />
              <div className="flex gap-[clamp(0.75rem,1.5vw,1rem)] max-[768px]:flex-col">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    placeholder="Company size*"
                    className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
                    required
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Country*"
                    className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
                    required
                  />
                </div>
              </div>
              <textarea
                name="hearAbout"
                value={formData.hearAbout}
                onChange={handleInputChange}
                placeholder="How did you hear about SILO?"
                rows={4}
                className="w-full px-[clamp(1rem,2vw,1.25rem)] py-[clamp(0.75rem,1.5vw,1rem)] text-[clamp(0.875rem,calc(1.2vw+0.25rem),1rem)] text-black bg-white border-none rounded-[clamp(0.625rem,1vw,0.75rem)] outline-none resize-y min-h-[clamp(5rem,10vw,6.25rem)] font-[inherit] transition-shadow duration-300 focus:shadow-[0_0_0_3px_rgba(0,0,0,0.1)] placeholder:text-[#666]"
              />
              <div className="flex gap-[clamp(0.75rem,1.5vw,1rem)] mt-[clamp(0.375rem,1vw,0.5rem)] max-[768px]:flex-col max-[768px]:gap-[clamp(0.625rem,1.5vw,0.75rem)]">
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 px-[clamp(1.5rem,3vw,2rem)] py-[clamp(0.75rem,1.5vw,0.875rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase bg-transparent text-black border-2 border-black rounded-full cursor-pointer transition-all duration-300 hover:bg-black hover:text-white hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] max-[768px]:w-full"
                >
                  CLEAR
                </button>
                <button
                  type="submit"
                  className="flex-1 px-[clamp(1.5rem,3vw,2rem)] py-[clamp(0.75rem,1.5vw,0.875rem)] text-[clamp(0.6875rem,calc(1vw+0.1rem),0.8125rem)] font-semibold tracking-[0.1em] uppercase bg-black text-white border-2 border-black rounded-full cursor-pointer transition-all duration-300 hover:bg-[#333] hover:border-[#333] hover:-translate-y-[2px] hover:shadow-[0_8px_16px_rgba(0,0,0,0.2)] max-[768px]:w-full"
                >
                  SAVE
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />

      {/* Get Started Modal */}
      {isGetStartedModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsGetStartedModalOpen(false);
              setEmail("");
            }
          }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          <div 
            className="bg-white rounded-[20px] p-10 max-w-[440px] w-full relative shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            <button
              onClick={() => {
                setIsGetStartedModalOpen(false);
                setEmail("");
              }}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-[#1a1a1a] hover:bg-gray-100 transition-all"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="flex flex-col items-center">
              {/* Rocket Icon */}
              <div className="mb-8 w-20 h-20 bg-gradient-to-br from-[#1a1a1a] to-[#333] rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path>
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path>
                </svg>
              </div>

              <h2 className="text-[28px] font-bold text-[#1a1a1a] mb-3 text-center">Get started with Silo</h2>
              <p className="text-gray-500 text-base mb-8 text-center">Enter your work email to create your account</p>

              <form onSubmit={handleModalSubmit} className="w-full">
                <div className="flex flex-col gap-2.5 mb-6">
                  <label className="text-[15px] font-medium text-[#1a1a1a]">Work email</label>
                  <input
                    type="email"
                    placeholder="e.g. john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-4 text-base text-[#1a1a1a] border-[1.5px] border-gray-200 rounded-[10px] outline-none transition-all hover:border-gray-300 focus:border-[#1a1a1a] focus:shadow-[0_0_0_3px_rgba(26,26,26,0.06)]"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-10 py-4 text-[13px] font-semibold tracking-[1.5px] uppercase text-white bg-[#1a1a1a] border-none rounded-full cursor-pointer transition-all hover:bg-[#333] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none"
                >
                  Continue
                </button>
              </form>

              <p className="text-sm text-gray-400 mt-6 text-center">
                Already have an account?{" "}
                <a href="/login" className="text-green-600 font-medium hover:text-green-700 transition-colors">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes floatUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
