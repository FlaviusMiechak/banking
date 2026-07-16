import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import { normalizeAccounts, toAppUser } from "@/lib/utils";
import DashboardClient from "./DashboardClient";

type Props = { searchParams?: { page?: string } };

export default async function Dashboard({ searchParams }: Props) {
  const page = searchParams?.page;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

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
    <DashboardClient
      user={sidebarUser}
      sidebarUser={sidebarUser}
      accountsData={accountsData}
      account={account}
      accountsResponse={accountsResponse}
      currentPage={currentPage}
      activeAccountId={activeAccountId}
    />
  );
}
