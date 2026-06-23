/* eslint-disable no-prototype-builtins */

import { type ClassValue, clsx } from "clsx";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import qs from "query-string";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// =========================
// FORMAT DATE TIME
// =========================

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  return {
    dateTime: new Date(dateString).toLocaleString(
      "en-US",
      dateTimeOptions
    ),

    dateDay: new Date(dateString).toLocaleString(
      "en-US",
      dateDayOptions
    ),

    dateOnly: new Date(dateString).toLocaleString(
      "en-US",
      dateOptions
    ),

    timeOnly: new Date(dateString).toLocaleString(
      "en-US",
      timeOptions
    ),
  };
};

// =========================
// FORMAT AMOUNT
// =========================

export function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

// =========================
// HELPERS
// =========================

export const parseStringify = (value: any) =>
  JSON.parse(JSON.stringify(value));

export const removeSpecialCharacters = (
  value: string
) => value.replace(/[^\w\s]/gi, "");

export const normalizeAccount = (account: any): Account => ({
  ...account,
  bankId: account.bankId || account.id,
  institutionId: account.institutionId || "",
  officialName: account.officialName || "",
  mask: account.mask || "",
  subtype: account.subtype || "",
  type: account.type || "",
  shareableId: account.shareableId || "",
});

export const normalizeAccounts = (accounts: any[] = []): Account[] =>
  accounts.map(normalizeAccount);

export const toAppUser = (user: SupabaseUser): User => ({
  id: user.id,
  email: user.email ?? "unknown@example.com",
  firstName:
    user.user_metadata?.firstName ??
    user.user_metadata?.first_name ??
    user.user_metadata?.full_name ??
    "Guest",
  lastName:
    user.user_metadata?.lastName ??
    user.user_metadata?.last_name ??
    "",
});

interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

export function formUrlQuery({
  params,
  key,
  value,
}: UrlQueryParams) {
  const currentUrl = qs.parse(params);

  currentUrl[key] = value;

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    {
      skipNull: true,
    }
  );
}

// =========================
// ACCOUNT COLORS
// =========================

export function getAccountTypeColors(
  type: AccountTypes
) {
  switch (type) {
    case "depository":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      };

    case "credit":
      return {
        bg: "bg-success-25",
        lightBg: "bg-success-100",
        title: "text-success-900",
        subText: "text-success-700",
      };

    default:
      return {
        bg: "bg-green-25",
        lightBg: "bg-green-100",
        title: "text-green-900",
        subText: "text-green-700",
      };
  }
}

// =========================
// TRANSACTION HELPERS
// =========================

export function countTransactionCategories(
  transactions: Transaction[]
): CategoryCount[] {
  const categoryCounts: Record<string, number> = {};

  let totalCount = 0;

  transactions?.forEach((transaction) => {
    const category = transaction.category;

    if (categoryCounts.hasOwnProperty(category)) {
      categoryCounts[category]++;
    } else {
      categoryCounts[category] = 1;
    }

    totalCount++;
  });

  return Object.keys(categoryCounts)
    .map((category) => ({
      name: category,
      count: categoryCounts[category],
      totalCount,
    }))
    .sort((a, b) => b.count - a.count);
}

// =========================
// ENCRYPTION
// =========================

export function encryptId(id: string) {
  return btoa(id);
}

export function decryptId(id: string) {
  return atob(id);
}

// =========================
// TRANSACTION STATUS
// =========================

export const getTransactionStatus = (
  date: Date
) => {
  const today = new Date();

  const twoDaysAgo = new Date(today);

  twoDaysAgo.setDate(today.getDate() - 2);

  return date > twoDaysAgo
    ? "Processing"
    : "Success";
};

// =========================
// AUTH FORM SCHEMA
// =========================

export const authFormSchema = (
  type: "sign-in" | "sign-up"
) =>
  z.object({
    firstName:
      type === "sign-up"
        ? z
            .string()
            .min(
              2,
              "First name must be at least 2 characters"
            )
            .max(50)
        : z.string().optional(),

    lastName:
      type === "sign-up"
        ? z
            .string()
            .min(
              2,
              "Last name must be at least 2 characters"
            )
            .max(50)
        : z.string().optional(),

    email: z
      .string()
      .email("Please enter a valid email address"),

    password: z
      .string()
      .min(
        8,
        "Password must be at least 8 characters"
      )
      .max(100),
  });
