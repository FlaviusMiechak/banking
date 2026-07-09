'use server';

import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { getTransactionsBybank_id } from "./transaction.actions";

/* -----------------------------
   Helpers
------------------------------ */

function generateAccountNumber() {
  return Math.floor(
    1000000000 + Math.random() * 9000000000
  ).toString();
}

function generateIBAN() {
  const random = crypto.randomBytes(10).toString("hex").toUpperCase();
  return `CM${Date.now()}${random}`;
}

const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/* -----------------------------
   Mapping
------------------------------ */

const mapBankAccount = (bank: any) => ({
  id: bank.id,

  availableBalance: toNumber(
    bank.available_balance ?? bank.availableBalance ?? bank.current_balance
  ),

  currentBalance: toNumber(
    bank.current_balance ?? bank.currentBalance ?? bank.balance
  ),

  institutionId: bank.institution_id ?? bank.institutionId ?? "",

  name:
    bank.name ??
    bank.bank_name ??
    bank.official_name ??
    "Bank account",

  officialName:
    bank.official_name ??
    bank.officialName ??
    bank.bank_name ??
    bank.name ??
    null,

  mask:
    bank.mask ??
    bank.last4 ??
    bank.account_last4 ??
    null,

  type: bank.type ?? "depository",
  subtype: bank.subtype ?? null,

  bank_id: bank.id,
  shareableId: bank.shareable_id ?? bank.shareableId ?? null,
});

const mapTransaction = (transaction: any, bank_id?: string) => ({
  id: transaction.id,

  name:
    transaction.name ??
    transaction.note ??
    transaction.recipient_email ??
    transaction.recipientEmail ??
    "Payment",

  amount: toNumber(transaction.amount),

  date:
    transaction.created_at ??
    transaction.createdAt ??
    transaction.created ??
    null,

  paymentChannel: transaction.channel ?? "stripe",
  category: transaction.category ?? "Transfer",

  type:
    transaction.type ??
    (bank_id && transaction.sender_bank_id === bank_id
      ? "debit"
      : "credit"),

  accountId:
    transaction.account_id ??
    transaction.sender_bank_id ??
    transaction.receiver_bank_id ??
    bank_id ??
    "",

  pending:
    transaction.status
      ? transaction.status !== "completed"
      : false,

  image: transaction.image ?? "",
  channel: transaction.channel ?? "stripe",

  senderbank_id: transaction.sender_bank_id ?? "",
  receiverbank_id: transaction.receiver_bank_id ?? "",

  $createdAt:
    transaction.created_at ??
    transaction.createdAt ??
    "",
});

/* -----------------------------
   Accounts
------------------------------ */

export const getAccounts = async ({ user_id }: { user_id: string }) => {
  try {
    const supabase = createAdminClient();

    const { data: banks, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", user_id);

    if (error) throw error;

    const accounts = (banks ?? []).map(mapBankAccount);

    const totalCurrentBalance = accounts.reduce(
      (total, account) => total + account.currentBalance,
      0
    );

    return {
      data: accounts,
      totalBanks: accounts.length,
      totalCurrentBalance,
    };
  } catch (error) {
    console.error("Error fetching accounts:", error);

    return {
      data: [],
      totalBanks: 0,
      totalCurrentBalance: 0,
    };
  }
};

export async function getAccount({
  bank_id,
}: {
  bank_id: string;
}) {
  const supabase = createAdminClient();

  const { data: bank, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", bank_id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  if (!bank) return null;

  const transferTransactionsData =
    await getTransactionsBybank_id({ bank_id });

  return {
    data: mapBankAccount(bank),
    transactions: (transferTransactionsData.documents ?? []).map(
      (tx: any) => mapTransaction(tx, bank_id)
    ),
  };
}

export const getTransactions = async ({
  bank_id,
}: {
  bank_id: string;
}) => {
  const transactions = await getTransactionsBybank_id({ bank_id });

  return (transactions.documents ?? []).map((transaction: any) =>
    mapTransaction(transaction, bank_id)
  );
};

/* -----------------------------
   Bank Creation
------------------------------ */

export async function createBankAccount({
  user_id,
  accountName,
}: {
  user_id: string;
  accountName: string;
}) {
  const supabase = createAdminClient();

  const accountNumber = generateAccountNumber();
  const iban = generateIBAN();

  const { data, error } = await supabase
    .from("bank_accounts")
    .insert({
      user_id: user_id,

      account_number: accountNumber,
      iban:generateIBAN(),

      bank_name: "Nova Bank",
      institution_id: "NOVA",

      account_name: accountName,
      official_name: accountName,

      account_type: "checking",
      subtype: "personal",

      currency: "XAF",

      current_balance: 0,
      available_balance: 0,
      frozen_balance: 0,

      mask: accountNumber.slice(-4),

      status: "active",
    })
    .select()
    .single();

  if (error) {
    console.error("Bank creation error:", error);
    throw new Error("Unable to create bank account.");
  }

  return data;
}

/* -----------------------------
   Get Bank by User
------------------------------ */

export async function getBankAccountByUserId(user_id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("user_id", user_id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}