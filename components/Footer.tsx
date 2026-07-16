"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface FooterProps {
  user: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
  type?: "desktop" | "mobile";
}

const Footer = ({ user, type = "desktop" }: FooterProps) => {
  const router = useRouter();

  const handleLogOut = async () => {
    await createClient().auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const displayName =
    user.first_name ||
    user.email.split("@")[0];

  return (
    <footer className="footer">
      <div
        className={
          type === "mobile"
            ? "first_name"
            : "first_name"
        }
      >
        <p className="text-xl font-bold text-gray-700">
          {displayName.charAt(0).toUpperCase()}
        </p>
      </div>

      <div
        className={
          type === "mobile"
            ? "footer_email-mobile"
            : "footer_email"
        }
      >
        <h1 className="truncate text-14 font-semibold text-gray-700">
          {displayName}
        </h1>

        <p className="truncate text-14 font-normal text-gray-600">
          {user.email}
        </p>
      </div>

      <button
        onClick={handleLogOut}
        className="footer_image"
        aria-label="Log out"
      >
        <Image
          src="/icons/logout.svg"
          fill
          alt="Log out"
        />
      </button>
    </footer>
  );
};

export default Footer;