import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions';
import { getLoggedInUser } from '@/lib/actions/user.action';
import { normalizeAccounts, toAppUser } from '@/lib/utils';
import React from 'react'

const MyBanks = async () => {
  const loggedIn = await getLoggedInUser();
  if (!loggedIn) return null;

  const accountsResponse = await getAccounts({
    userId: loggedIn.id
  })

  const accounts = normalizeAccounts(accountsResponse.data);
  const appUser = toAppUser(loggedIn);
  const userName = `${appUser.firstName} ${appUser.lastName}`.trim();

  return (
    <section className='flex'>
      <div className="my-banks">
        <HeaderBox 
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activites."
        />

        <div className="space-y-4">
          <h2 className="header-2">
            Your cards
          </h2>
          <div className="flex flex-wrap gap-6">
            {accounts.map((a) => (
              <BankCard
                key={a.id}
                account={a}
                userName={userName}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default MyBanks
