"use client";

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import BankCard from './BankCard'
import { countTransactionCategories } from '@/lib/utils'
import Category from './Category'
import { getCards, getAllCards } from "@/lib/actions/card.actions";
import { useEffect, useState } from "react";
import { 
  Plus, 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  ChevronRight,
  Loader2
} from 'lucide-react';

const RightSidebar = ({ user, transactions, banks }: RightSidebarProps) => {
  const categories: CategoryCount[] = countTransactionCategories(transactions);
  const [userCards, setUserCards] = useState<any[]>(banks ?? []);
  const [loading, setLoading] = useState(true);
  const [showAllCards, setShowAllCards] = useState(false);

  useEffect(() => {
    async function fetchCards() {
      try {
        const cards = await getCards(user.id);
        if (cards && cards.length > 0) {
          setUserCards(cards);
        } else {
          setUserCards([]);
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
        setUserCards([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCards();
  }, [user.id]);

  const displayedCards = showAllCards ? userCards : userCards.slice(0, 2);

  return (
    <aside className="right-sidebar w-[340px] min-h-screen bg-[#0a0a0f] border-l border-white/5 p-6 flex flex-col">
      {/* User Profile Section */}
      <section className="flex flex-col pb-6 border-b border-white/5">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl" />
          <div className="relative bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-2xl p-6 border border-white/5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="text-2xl font-bold text-white">
                    {user.firstName?.[0] || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#0a0a0f]" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-white truncate">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-sm text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banks Section */}
      <section className="flex-1 py-6 space-y-6 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-medium text-gray-300">My Cards</h2>
          </div>
          <button 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-300 text-xs font-medium text-gray-400 hover:text-white border border-white/5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        )}

        {/* Cards Grid */}
        {!loading && userCards.length > 0 && (
          <div className="space-y-3">
            <div className="space-y-3">
              {displayedCards.map((card) => {
                const cardData = {
                  id: card.id,
                  name: card.cardholder_name || `${user.firstName}'s Card`,
                  currentBalance: card.spending_limit || 0,
                  mask: card.last4 || "0000",
                  shareableId: card.stripe_card_id,
                  expMonth: card.exp_month || undefined,
                  expYear: card.exp_year || undefined,
                  brand: card.brand || undefined,
                  status: card.status || undefined,
                };
                
                return (
                  <div key={card.id} className="group">
                    <BankCard
                      account={cardData}
                      userName={`${user.firstName} ${user.lastName || ''}`}
                      showBalance={false}
                    />
                  </div>
                );
              })}
            </div>

            {/* Show More/Less Button */}
            {userCards.length > 2 && (
              <button
                onClick={() => setShowAllCards(!showAllCards)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-300 text-sm font-medium text-gray-400 hover:text-white border border-white/5"
              >
                {showAllCards ? 'Show Less' : `View All (${userCards.length})`}
                <ChevronRight className={`w-4 h-4 transition-transform ${showAllCards ? 'rotate-90' : ''}`} />
              </button>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && userCards.length === 0 && (
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500" />
            <div className="relative bg-white/5 rounded-2xl p-6 text-center border border-white/5">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-300 mb-1">No Cards Yet</h3>
              <p className="text-xs text-gray-500">Create your first virtual card</p>
              <button className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium text-white transition-all duration-300">
                Create Card
              </button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {userCards.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total Cards</p>
              <p className="text-lg font-semibold text-white mt-0.5">{userCards.length}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-3 border border-white/5">
              <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Active</p>
              <p className="text-lg font-semibold text-emerald-400 mt-0.5">
                {userCards.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        )}

        {/* Top Categories */}
        <div className="pt-6 border-t border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-medium text-gray-300">Spending Categories</h2>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-3">
              {categories.slice(0, 5).map((category) => (
                <Category key={category.name} category={category} />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs text-gray-500">No spending data yet</p>
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }
      `}</style>
    </aside>
  )
}

export default RightSidebar;