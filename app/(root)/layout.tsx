import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";

import getLoggedInUserClient from "@/lib/actions/user.client";
import { toAppUser } from "@/lib/utils";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BankingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let loggedIn = null;

  try {
    loggedIn = await getLoggedInUserClient();
  } catch (error) {
    console.error("Failed to fetch logged in user:", error);
    redirect("/sign-in");
  }

  if (!loggedIn) {
    redirect("/sign-in");
  }

  const sidebarUser = toAppUser(loggedIn);

  // Replace these with your actual fields from the users/profiles table
  const kycSubmitted =
    loggedIn.kyc_submitted ||
    loggedIn.kycStatus === "submitted" ||
    loggedIn.kyc_status === "submitted";

  return (
    <main className="flex h-screen w-full font-inter">
      {/* Desktop Sidebar */}
      <Sidebar user={sidebarUser} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="root-layout flex items-center justify-between border-b px-6 py-4">
          <Image
            src="/icons/logo.svg"
            width={32}
            height={32}
            alt="Logo"
            priority
          />

          <MobileNav user={sidebarUser} />
        </header>

        {/* KYC Banner */}
        {!kycSubmitted && (
          <div className="bg-yellow-50 border-b border-yellow-300 px-6 py-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-yellow-900">
                  Identity verification required
                </p>

                <p className="text-sm text-yellow-800">
                  Complete your KYC verification to activate your virtual card
                  and banking features.
                </p>
              </div>

              <Link
                href="/kyc"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Complete KYC
              </Link>
            </div>
          </div>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </main>
  );
}