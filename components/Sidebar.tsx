// Sidebar.tsx (SERVER COMPONENT)
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { getCards } from "@/lib/actions/card.actions";

interface SidebarProps {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export default async function Sidebar({ user }: SidebarProps) {
  const cards = await getCards(user.id); // ✅ FIXED

  const cardId = cards?.[0]?.id;
  const links = sidebarLinks(cardId);

  const pathname = ""; // ❗ cannot use usePathname in server component

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 flex items-center gap-2">
          <Image src="/icons/logo.svg" width={34} height={34} alt="logo" />
          <h1 className="sidebar-logo">Horizon</h1>
        </Link>

        {links.map((item) => {
          const isActive =
            pathname === item.route ||
            pathname.startsWith(`${item.route}/`);

          return (
            <Link key={item.label} href={item.route} className="sidebar-link">
              <div className="relative size-6">
                <Image src={item.imgURL} alt={item.label} fill />
              </div>

              <p className="sidebar-label">{item.label}</p>
            </Link>
          );
        })}
      </nav>

      <Footer user={user} />
    </section>
  );
}