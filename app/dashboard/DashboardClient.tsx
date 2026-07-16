"use client";
import { useEffect, useState } from "react";
import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import CardOnboardingModal from "@/components/CardOnboardingModal";
import CardVerificationForm from "@/components/CardVerificationForm";
import BankCard from "@/components/BankCard";
import { getCards, getAllCards } from "@/lib/actions/card.actions";

type DashboardClientProps = {
  user: { id: string; firstName: string; email: string };
  sidebarUser: { id: string; firstName: string; email: string; lastName: string };
  accountsData: any[];
  account?: any;
  accountsResponse: { totalBanks: number; totalCurrentBalance: number };
  currentPage?: number;
  activeAccountId?: string | number;
};

export default function DashboardClient({
  user,
  sidebarUser,
  accountsData,
  account,
  accountsResponse,
  currentPage,
  activeAccountId,
}: DashboardClientProps) {
  const [showCardModal, setShowCardModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userCards, setUserCards] = useState<any[]>([]);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [selectedCardForVerification, setSelectedCardForVerification] = useState<any>(null);

  useEffect(() => {
    async function fetchCards() {
      try {
        console.log("=== Fetching cards for user:", user.id);
        
        // Try to get cards
        const cards = await getCards(user.id);
        console.log("Cards from getCards:", cards);
        
        if (cards && cards.length > 0) {
          setUserCards(cards);
          setShowCardModal(false);
          setDebugInfo(`Found ${cards.length} cards`);
          
          // Check if any card needs verification
          const needsVerification = cards.some(
            (card) => card.verification_status === 'pending' && card.status === 'inactive'
          );
          
          if (needsVerification) {
            // Find the first card that needs verification
            const cardToVerify = cards.find(
              (card) => card.verification_status === 'pending' && card.status === 'inactive'
            );
            setSelectedCardForVerification(cardToVerify);
            setShowVerificationModal(true);
          }
        } else {
          // If no cards found, try to get all cards (debug)
          console.log("No cards found, fetching all cards...");
          const allCards = await getAllCards();
          console.log("All cards in database:", allCards);
          
          if (allCards && allCards.length > 0) {
            setDebugInfo(`No cards for this user, but ${allCards.length} cards exist in the database. User ID: ${user.id}`);
          } else {
            setDebugInfo("No cards found in the database at all.");
          }
          
          setUserCards([]);
          setShowCardModal(true);
        }
      } catch (error) {
        console.error("Error fetching cards:", error);
        setDebugInfo(`Error: ${error}`);
        setShowCardModal(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCards();
  }, [user.id]);

  const handleCardCreated = async () => {
    // Refresh cards after successful creation
    const cards = await getCards(user.id);
    setUserCards(cards || []);
    setShowCardModal(false);
    
    // Check if the new card needs verification
    if (cards && cards.length > 0) {
      const needsVerification = cards.some(
        (card) => card.verification_status === 'pending' && card.status === 'inactive'
      );
      
      if (needsVerification) {
        const cardToVerify = cards.find(
          (card) => card.verification_status === 'pending' && card.status === 'inactive'
        );
        setSelectedCardForVerification(cardToVerify);
        setShowVerificationModal(true);
      }
    }
  };

  const handleVerificationSuccess = async () => {
    // Refresh cards after verification
    const cards = await getCards(user.id);
    setUserCards(cards || []);
    setShowVerificationModal(false);
    setSelectedCardForVerification(null);
  };

  if (loading) {
    return (
      <section className="home">
        <div className="home-content">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="spinner mb-4"></div>
              <p className="text-gray-500">Loading your cards...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

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

        {/* Display cards that need verification */}
        {userCards.some(card => card.verification_status === 'pending') && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-yellow-800 font-semibold">⚠️ Action Required</h3>
                <p className="text-yellow-700 text-sm">
                  One or more of your cards needs identity verification to activate.
                </p>
              </div>
              <button
                onClick={() => {
                  const cardToVerify = userCards.find(
                    (card) => card.verification_status === 'pending'
                  );
                  setSelectedCardForVerification(cardToVerify);
                  setShowVerificationModal(true);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Verify Now
              </button>
            </div>
          </div>
        )}

        <RecentTransactions
          accounts={accountsData}
          transactions={account?.transactions || []}
          bank_id={String(activeAccountId || "")}
          page={currentPage || 1}
        />
      </div>

      <RightSidebar
        user={sidebarUser}
        transactions={account?.transactions || []}
        banks={accountsData.slice(0, 2)}
      />

      {/* Card Creation Modal */}
      {showCardModal && (
        <CardOnboardingModal
          user={user}
          onSuccess={handleCardCreated}
          onClose={() => setShowCardModal(false)}
        />
      )}

      {/* KYC Verification Modal */}
      {showVerificationModal && selectedCardForVerification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Verify Your Identity</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete KYC verification to activate your card
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowVerificationModal(false);
                    setSelectedCardForVerification(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Card Preview */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white/70 text-xs uppercase tracking-wider">Card to Activate</p>
                    <p className="text-white font-mono text-lg">
                      •••• •••• •••• {selectedCardForVerification.last4 || '0000'}
                    </p>
                    <p className="text-white/70 text-sm mt-1">
                      {selectedCardForVerification.cardholder_name || 'Cardholder'}
                    </p>
                  </div>
                  <div className="text-white/70 text-sm uppercase">
                    {selectedCardForVerification.brand || 'Visa'}
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <CardVerificationForm
                cardholderId={selectedCardForVerification.stripe_cardholder_id}
                userId={user.id}
                cardId={selectedCardForVerification.id}
                onSuccess={handleVerificationSuccess}
                onCancel={() => {
                  setShowVerificationModal(false);
                  setSelectedCardForVerification(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}