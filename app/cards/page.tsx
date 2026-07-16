// app/cards/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useUser } from '@/hooks/useUser';
import { cardService } from '@/lib/services/card.service';
import Image from "next/image";
import Link from "next/link";
import { formatAmount } from "@/lib/utils";
import CardVerificationForm from '@/components/CardVerificationForm';

interface Card {
  id: string;
  user_id: string;
  stripe_cardholder_id: string;
  stripe_card_id: string;
  card_last4: string;
  card_brand: string;
  card_exp_month: number;
  card_exp_year: number;
  cardholder_name: string;
  status: string;
  is_active: boolean;
  card_type?: string;
  currency?: string;
  spending_limit?: number;
  billing_address?: any;
  created_at: string;
  activated_at: string | null;
  verification_status: string;
}

export default function CardsPage() {
  const { user, loading: userLoading } = useUser();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [cardToVerify, setCardToVerify] = useState<Card | null>(null);

  const loadCards = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userCards = await cardService.getUserCards(user.id);
      setCards(userCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!userLoading && user) {
      loadCards();
    }
  }, [user, userLoading, loadCards]);

  const handleCreateCard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/create-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create card');
      }

      if (data.requiresVerification) {
        setCardToVerify(data.card);
        setShowVerificationModal(true);
      } else {
        await loadCards();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCard = (card: Card) => {
    setCardToVerify(card);
    setShowVerificationModal(true);
  };

  const getCardBrandIcon = (brand: string) => {
    const icons: Record<string, string> = {
      visa: '/icons/visa.svg',
      mastercard: '/icons/mastercard.svg',
      amex: '/icons/amex.svg',
      discover: '/icons/discover.svg',
    };
    return icons[brand.toLowerCase()] || '/icons/mastercard.svg';
  };

  const getStatusBadge = (card: Card) => {
    if (card.verification_status === 'pending') {
      return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">Needs Verification</span>;
    }
    if (!card.is_active) {
      return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">Inactive</span>;
    }
    if (card.status === 'active') {
      return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Active</span>;
    }
    return <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">{card.status}</span>;
  };

  if (userLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12 bg-white rounded-lg shadow">
        <div className="text-6xl mb-4">🔒</div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Please Sign In</h3>
        <p className="text-gray-600">You need to be signed in to view your cards.</p>
        <Link href="/sign-in" className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Cards</h1>
        <button
          onClick={handleCreateCard}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : '+ Create New Card'}
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Cards Yet</h3>
          <p className="text-gray-600">Get started by creating your first card.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <div key={card.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="text-3xl">
                    <Image
                      src={getCardBrandIcon(card.card_brand)}
                      width={45}
                      height={32}
                      alt={card.card_brand || "Card"}
                    />
                  </div>
                  {getStatusBadge(card)}
                </div>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Card Number</p>
                  <p className="text-lg font-mono font-semibold">•••• •••• •••• {card.card_last4}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Cardholder</p>
                  <p className="font-semibold">{card.cardholder_name}</p>
                </div>

                <div className="flex justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Expires</p>
                    <p className="font-semibold">{card.card_exp_month}/{card.card_exp_year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold capitalize">{card.status}</p>
                  </div>
                </div>

                {card.verification_status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleVerifyCard(card)}
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 rounded-lg text-sm transition-colors"
                    >
                      Verify Your Identity
                    </button>
                  </div>
                )}

                {card.activated_at && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Activated: {new Date(card.activated_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {showVerificationModal && cardToVerify && (
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
                  onClick={() => setShowVerificationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <CardVerificationForm 
                cardholderId={cardToVerify.stripe_cardholder_id}
                userId={user.id}
                cardId={cardToVerify.id}
                onSuccess={() => {
                  setShowVerificationModal(false);
                  loadCards();
                }}
                onCancel={() => setShowVerificationModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}