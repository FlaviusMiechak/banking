"use client";

import BankCard from '@/components/BankCard';
import HeaderBox from '@/components/HeaderBox'
import { getAccounts } from '@/lib/actions/bank.actions';
import { createClient } from '@/lib/supabase/client';
import { normalizeAccounts } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MyBanksClient() {
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();
        
        if (error || !authUser) {
          router.push('/sign-in');
          return;
        }

        // Get user profile
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (userData) {
          setUser(userData);
        }

        // Get accounts
        const accountsResponse = await getAccounts({
          user_id: authUser.id
        });

        setAccounts(normalizeAccounts(accountsResponse?.data || []));
      } catch (error) {
        console.error("Error loading data:", error);
        router.push('/sign-in');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0f]">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-400">Loading your cards...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

  return (
    <section className='flex min-h-screen bg-[#0a0a0f]'>
      <div className="my-banks p-4 md:p-8 w-full max-w-7xl mx-auto">
        <HeaderBox 
          title="My Bank Accounts"
          subtext="Effortlessly manage your banking activities."
        />

        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Your Cards
            </h2>
            <span className="text-sm text-gray-400">
              {accounts.length} card{accounts.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {accounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((a) => (
                <BankCard
                  key={a.id}
                  account={a}
                  userName={userName}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/10">
              <div className="text-5xl mb-4 opacity-30">💳</div>
              <h3 className="text-lg font-medium text-white mb-2">No Cards Found</h3>
              <p className="text-gray-400 text-sm">You don't have any cards yet. Create one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}