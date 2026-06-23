"use client";
import React from "react";
import { useRouter } from "next/navigation";
import 
type ButtonAction = {
  label: string;
  variant: "primary" | "secondary" | "tertiary" | "quaternary";
  route?: string;
  onClick?: () => void;
};

const buttons: ButtonAction[] = [
  { label: "Transfer", variant: "primary", route: "/transfer" },
  { label: "Pay Bills", variant: "secondary", route: "/bills" },
  { label: "Deposit", variant: "tertiary", route: "/deposit" },
  { label: "Withdraw", variant: "quaternary", route: "/withdraw" },
];

const TransactionalButtons = () => {
  const router = useRouter();

  const handleClick = (btn: ButtonAction) => {
    if (btn.onClick) return btn.onClick();
    if (btn.route) router.push(btn.route);
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={() => handleClick(btn)}
          className={`btn-${btn.variant}`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
};

export default TransactionalButtons;