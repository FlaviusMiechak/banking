'use server'

import { createClient } from '@/lib/supabase/server'

export async function createTransaction(
  transaction: CreateTransactionProps
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      amount: transaction.amount,

      name: transaction.name,

      sender_bank_id: transaction.senderbank_id,
      receiver_bank_id: transaction.receiverbank_id,

      sender_user_id: transaction.senderId,
      receiver_user_id: transaction.receiverId,

      category: "Transfer",
      channel: "online",

      type: "transfer",

      status: "completed",

      reference: crypto.randomUUID(),
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export async function getTransactionsBybank_id({
  bank_id,
}: {
  bank_id: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .or(
      `sender_bank_id.eq.${bank_id},receiver_bank_id.eq.${bank_id}`
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);

    return {
      total: 0,
      documents: [],
    };
  }

  return {
    total: data.length,
    documents: data,
  };
}

export async function getAccount({
  bank_id,
}: {
  bank_id: string;
}) {

  const supabase = createClient();

  const { data: account } = await supabase
    .from("bank_accounts")
    .select("*")
    .eq("id", bank_id)
    .maybeSingle();

  if (!account) return null;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*")
    .or(
      `sender_bank_id.eq.${bank_id},receiver_bank_id.eq.${bank_id}`
    )
    .order("created_at", {
      ascending: false,
    });

  return {
    data: account,
    transactions: transactions ?? [],
  };
}

