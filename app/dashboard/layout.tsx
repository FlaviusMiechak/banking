import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.action";
import { toAppUser } from "@/lib/utils";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function BankingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect("/sign-in");

  const sidebarUser = toAppUser(loggedIn);

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={sidebarUser} />

      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <div>
            <MobileNav user={sidebarUser} />
          </div>
        </div>
        {children}
      </div>
    </main>
  );
}
