import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { toAppUser } from "@/lib/utils";

export default async function BankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  const sidebarUser = toAppUser(user);

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={sidebarUser} />

      <div className="flex flex-1 flex-col">
        <div className="root-layout flex items-center justify-between p-4 border-b">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <MobileNav user={sidebarUser} />
        </div>

        {children}
      </div>
    </main>
  );
}