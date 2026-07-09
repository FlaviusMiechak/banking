import { redirect } from "next/navigation";
import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { createClient } from "@/lib/supabase/server";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { normalizeAccounts, toAppUser } from "@/lib/utils";
import TransactionalButtons from "@/components/transactionalButtons";

export default async function Dashboard({
  searchParams: { page },
}: {
  searchParams: { page?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const currentPage = Number(page) || 1;

  const accountsResponse = await getAccounts({ user_id: user.id });
  if (!accountsResponse || accountsResponse.data.length === 0) {
    return <p>No accounts found</p>;
  }

  const accountsData = normalizeAccounts(accountsResponse.data);
  const activeAccountId = accountsData[0]?.bank_id || user.id;
  const account = await getAccount({ bank_id: activeAccountId });
  const sidebarUser = toAppUser(user);

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={sidebarUser.firstName}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accountsResponse.totalBanks}
            totalCurrentBalance={accountsResponse.totalCurrentBalance}
          />
        </header>
        
        <RecentTransactions
          accounts={accountsData}
          transactions={account?.transactions || []}
          bank_id={activeAccountId}
          page={currentPage}
        />
      </div>

      <RightSidebar
        user={sidebarUser}
        transactions={account?.transactions || []}
        banks={accountsData.slice(0, 2)}
      />
    </section>
  );
}
