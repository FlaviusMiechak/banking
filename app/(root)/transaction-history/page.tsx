// app/transaction-history/page.tsx
import HeaderBox from "@/components/HeaderBox";
import { Pagination } from "@/components/Pagination";
import TransactionsTable from "@/components/TransactionsTable";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { createClient } from "@/lib/supabase/server"; // ✅ use server client
import { normalizeAccounts } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function TransactionHistory({
  searchParams: { page },
}: {
  searchParams: { page?: string };
}) {
  const supabase =await createClient();
  const { data: { user } } =await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const currentPage = Number(page) || 1;

  const accountsResponse = await getAccounts({ userId: user.id });
  if (!accountsResponse || accountsResponse.data.length === 0) {
    return <p>No accounts found</p>;
  }

  const accountsData = normalizeAccounts(accountsResponse.data);
  const activeAccountId = accountsData[0]?.bank_id || user.id;

  const account = await getAccount({ bankId: activeAccountId });
  const rowsPerPage = 10;
  const transactions = account?.transactions || [];
  const totalPages = Math.ceil(transactions.length / rowsPerPage) || 1;
  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;
  const currentTransactions = transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );

  return (
    <section className="transaction-history">
      <HeaderBox
        type="title"
        title="Transaction History"
        user={user.email}
        subtext="Review your past transactions."
      />

      <TransactionsTable
        transactions={currentTransactions}
      />

      <Pagination page={currentPage} totalPages={totalPages} />
    </section>
  );
}
