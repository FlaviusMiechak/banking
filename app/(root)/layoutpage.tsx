import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.server";
import { toAppUser } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BankingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Use the server-side function
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect("/sign-in");
  }

  const sidebarUser = toAppUser(loggedIn);

 

  return (
    <main className="flex h-screen w-full font-inter bg-[#0a0a0f]">
      {/* Desktop Sidebar */}
      <Sidebar user={sidebarUser} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="root-layout flex items-center justify-between border-b border-white/5 px-6 py-4 bg-[#0a0a0f]">
          <Image
            src="/icons/logo.svg"
            width={32}
            height={32}
            alt="Logo"
            priority
          />

          <MobileNav user={sidebarUser} />
        </header>

        

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </main>
  );
}