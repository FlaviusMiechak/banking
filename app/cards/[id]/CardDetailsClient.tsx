"use client";

import Image from "next/image";
import Link from "next/link";
import { formatAmount } from "@/lib/utils";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  ArrowLeft, 
  Printer, 
  Copy, 
  Check, 
  CreditCard, 
  Clock,
  TrendingUp,
  TrendingDown,
  Shield,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";

interface CardDetailsClientProps {
  card: any;
  user: any;
}

export default function CardDetailsClient({ card, user }: CardDetailsClientProps) {
  const [copied, setCopied] = useState(false);
  const [copiedCardId, setCopiedCardId] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [cardData, setCardData] = useState(card);
  
  // Full card number state
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);
  const [fullCardNumber, setFullCardNumber] = useState<string | null>(null);
  const [fullCardCvc, setFullCardCvc] = useState<string | null>(null);
  const [loadingCardDetails, setLoadingCardDetails] = useState(false);
  const [cardDetailsError, setCardDetailsError] = useState<string | null>(null);
  
  const supabase = createClient();
  const modalRef = useRef<HTMLDivElement>(null);

  
  // Fetch transactions for this card
  const fetchTransactions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("card_id", card.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching transactions:", error);
        setTransactionError(error.message);
        setTransactions([]);
        return;
      }
      
      setTransactions(data || []);
      setTransactionError(null);
      
    } catch (error) {
      console.error("Error:", error);
      setTransactionError("Failed to load transactions");
      setTransactions([]);
    }
  }, [card.id, supabase]);

  // Fetch card data
  const fetchCardData = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("cards")
        .select("*")
        .eq("id", card.id)
        .single();

      if (error) {
        console.error("Error fetching card data:", error);
      } else if (data) {
        setCardData(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }, [card.id, supabase]);

  // Fetch full card details from Stripe
// Fetch full card details from Stripe
const fetchFullCardDetails = async () => {
  if (fullCardNumber) {
    setShowFullCardNumber(!showFullCardNumber);
    return;
  }

  setLoadingCardDetails(true);
  setCardDetailsError(null);

  try {
    const response = await fetch(`/api/cards/${card.id}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch card details");
    }

    const data = await response.json();
    
    console.log("Card details response:", data);
    
    // Check if we got a full card number
    if (data.full_card_number && data.full_number_available) {
      setFullCardNumber(data.full_card_number);
      setFullCardCvc(data.cvc || null);
      setShowFullCardNumber(true);
      setCardDetailsError(null);
    } else {
      // Card is inactive or full number not available
      const statusMessage = data.status === 'inactive' 
        ? "Card is inactive. Full number is not available." 
        : "Full card number is not available. Only last 4 digits shown.";
      
      setFullCardNumber(`•••• •••• •••• ${data.last4 || card.last4}`);
      setFullCardCvc(null);
      setShowFullCardNumber(true);
      setCardDetailsError(statusMessage);
    }
  } catch (error: any) {
    console.error("Error fetching card details:", error);
    setCardDetailsError(error.message || "Failed to fetch card details");
    // Fallback: show the last4
    setFullCardNumber(`•••• •••• •••• ${card.last4}`);
    setShowFullCardNumber(true);
  } finally {
    setLoadingCardDetails(false);
  }
};
  // Format full card number with proper spacing
  const formatFullCardNumber = (number: string) => {
    const clean = number.replace(/\s/g, '');
    const groups = clean.match(/.{4}/g);
    return groups ? groups.join(' ') : number;
  };

  // Format card number for display (masked or full)
  const getDisplayCardNumber = () => {
    if (showFullCardNumber && fullCardNumber) {
      return formatFullCardNumber(fullCardNumber);
    }
    return formatCardNumber(cardData.last4);
  };

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchTransactions(), fetchCardData()]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchTransactions, fetchCardData]);

  // Handle Withdrawal
  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setActionError("Please enter a valid amount");
      return;
    }

    if (amountNum > (cardData.spending_limit || 0)) {
      setActionError(`Amount exceeds spending limit of ${formatAmount(cardData.spending_limit || 0)}`);
      return;
    }

    setProcessing(true);
    setActionError(null);

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          card_id: cardData.id,
          user_id: user.id,
          amount: -amountNum,
          type: "withdrawal",
          description: description || "Card Withdrawal",
          status: "completed",
          currency: cardData.currency || "USD",
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newLimit = (cardData.spending_limit || 0) - amountNum;
      const { error: updateError } = await supabase
        .from("cards")
        .update({ spending_limit: newLimit })
        .eq("id", cardData.id);

      if (updateError) throw updateError;

      setCardData({ ...cardData, spending_limit: newLimit });
      await fetchTransactions();

      setActionSuccess(true);
      setTimeout(() => {
        setShowWithdrawModal(false);
        setActionSuccess(false);
        setAmount("");
        setDescription("");
      }, 1500);

    } catch (error: any) {
      console.error("Withdrawal error:", error);
      setActionError(error.message || "Failed to process withdrawal");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Recharge
  const handleRecharge = async () => {
    const amountNum = parseFloat(amount);
    if (!amount || amountNum <= 0) {
      setActionError("Please enter a valid amount");
      return;
    }

    setProcessing(true);
    setActionError(null);

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          card_id: cardData.id,
          user_id: user.id,
          amount: amountNum,
          type: "deposit",
          description: description || "Card Recharge",
          status: "completed",
          currency: cardData.currency || "USD",
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      const newLimit = (cardData.spending_limit || 0) + amountNum;
      const { error: updateError } = await supabase
        .from("cards")
        .update({ spending_limit: newLimit })
        .eq("id", cardData.id);

      if (updateError) throw updateError;

      setCardData({ ...cardData, spending_limit: newLimit });
      await fetchTransactions();

      setActionSuccess(true);
      setTimeout(() => {
        setShowRechargeModal(false);
        setActionSuccess(false);
        setAmount("");
        setDescription("");
      }, 1500);

    } catch (error: any) {
      console.error("Recharge error:", error);
      setActionError(error.message || "Failed to process recharge");
    } finally {
      setProcessing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchTransactions(), fetchCardData()]);
    } catch (error) {
      console.error("Error refreshing:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format expiry date
  const formatExpiry = (month?: number | null, year?: number | null) => {
    if (!month || !year) return "●● / ●●";
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().slice(-2);
    return `${monthStr} / ${yearStr}`;
  };

  // Get card brand icon
  const getCardBrandIcon = (brand?: string | null) => {
    const brandLower = brand?.toLowerCase() || 'mastercard';
    const brandIcons: Record<string, string> = {
      visa: '/icons/visa.svg',
      mastercard: '/icons/mastercard.svg',
      amex: '/icons/amex.svg',
      discover: '/icons/discover.svg',
    };
    return brandIcons[brandLower] || '/icons/mastercard.svg';
  };

  // Get card gradient based on brand
  const getCardGradient = (brand?: string | null) => {
    const brandLower = brand?.toLowerCase() || 'mastercard';
    const gradients: Record<string, string> = {
      visa: 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
      mastercard: 'from-[#1a1a2e] via-[#2d1b3d] to-[#4a1942]',
      amex: 'from-[#1a1a2e] via-[#1a1a3e] to-[#0a2a4a]',
      discover: 'from-[#1a1a2e] via-[#2a1a2e] to-[#3a1a2e]',
    };
    return gradients[brandLower] || 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]';
  };

  // Get card status color
  const getStatusColor = (status?: string | null) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'inactive':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'blocked':
      case 'canceled':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status?: string | null) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return <Shield className="w-3 h-3" />;
      case 'inactive':
        return <Clock className="w-3 h-3" />;
      default:
        return <Shield className="w-3 h-3" />;
    }
  };

  // Format card number
  const formatCardNumber = (last4?: string | null) => {
    if (!last4) return "●●●● ●●●● ●●●● ●●●●";
    return `●●●● ●●●● ●●●● ${last4}`;
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, type: 'card' | 'id') => {
    navigator.clipboard.writeText(text);
    if (type === 'card') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedCardId(true);
      setTimeout(() => setCopiedCardId(false), 2000);
    }
  };

  // Get transaction type color
  const getTransactionTypeColor = (type?: string) => {
    const typeLower = type?.toLowerCase() || '';
    switch (typeLower) {
      case 'payment':
      case 'purchase':
      case 'debit':
      case 'withdrawal':
        return 'text-rose-400 bg-rose-500/10';
      case 'refund':
      case 'credit':
      case 'deposit':
        return 'text-emerald-400 bg-emerald-500/10';
      default:
        return 'text-gray-400 bg-gray-500/10';
    }
  };

  const getTransactionIcon = (type?: string) => {
    const typeLower = type?.toLowerCase() || '';
    switch (typeLower) {
      case 'payment':
      case 'purchase':
        return <TrendingDown className="w-4 h-4" />;
      case 'refund':
      case 'deposit':
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  const cardGradient = getCardGradient(cardData.brand);
  const fullName = cardData.cardholder_name || user?.user_metadata?.full_name || 'Cardholder';

  // Loading Skeleton
  const LoadingSkeleton = () => (
    <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
    {/**<Loader2 className="w-8 h-8 text-gray-400 animate-spin mx-auto" />*/}
      <p className="text-gray-400 mt-4 text-sm">Loading transactions...</p>
   </div>
  );

  // Modal Component
  const ActionModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    icon, 
    buttonText, 
    buttonColor,
    processing: isProcessing,
    actionSuccess: isSuccess,
    actionError: error,
    amount: amountValue,
    setAmount: setAmountValue,
    description: descValue,
    setDescription: setDescValue
  }: any) => {
    if (!isOpen) return null;

    const handleModalClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
        ref={modalRef}
      >
        <div 
          className="bg-[#1a1a2e] rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl animate-slideUp"
          onClick={handleModalClick}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${buttonColor} bg-opacity-10`}>
                {icon}
              </div>
              <h3 className="text-xl font-bold text-white">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              disabled={isProcessing}
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Amount ({cardData.currency || 'USD'})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  $
                </span>
                <input
                  type="number"
                  value={amountValue}
                  onChange={(e) => setAmountValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  disabled={isProcessing}
                  step="0.01"
                  min="0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Available balance: {formatAmount(cardData.spending_limit || 0)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Description (Optional)
              </label>
              <input
                type="text"
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                placeholder="Enter a description..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                disabled={isProcessing}
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-sm">
                {error}
              </div>
            )}

            {isSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-emerald-400 text-sm text-center">
                ✅ Transaction completed successfully!
              </div>
            )}

            <button
              onClick={onConfirm}
              disabled={isProcessing || isSuccess}
              className={`w-full py-3 rounded-xl font-medium transition-all duration-300 ${
                isProcessing || isSuccess
                  ? 'opacity-50 cursor-not-allowed'
                  : `${buttonColor} hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
              } text-white`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </span>
              ) : isSuccess ? (
                'Completed ✓'
              ) : (
                buttonText
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link 
            href="/dashboard" 
            className="group inline-flex items-center gap-2 text-gray-400 hover:text-white transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all duration-300 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50"
            >
              <Loader2 className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all duration-300 text-sm font-medium text-gray-300 hover:text-white"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Card Preview - 2/5 */}
          <div className="lg:col-span-2">
            <div className="sticky top-6">
              <div className="mb-4">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Card Details</span>
                <h1 className="text-2xl font-bold text-white mt-1">{cardData.brand || 'Card'}</h1>
              </div>
              
              {/* Card Display */}
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardGradient} p-6 sm:p-8 min-h-[320px] flex flex-col justify-between shadow-2xl shadow-black/30 border border-white/5`}>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                
                {/* Glossy Effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-30" />

                <div className="relative z-10 flex flex-col h-full">
                  {/* Top Section */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getCardBrandIcon(cardData.brand)}
                        width={48}
                        height={32}
                        alt={cardData.brand || "Card"}
                        className="drop-shadow-lg"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-[10px] font-medium uppercase tracking-wider">
                        {cardData.card_type || 'Virtual'}
                      </span>
                      <div className="w-8 h-6 bg-gradient-to-br from-amber-300 to-amber-500 rounded flex items-center justify-center">
                        <div className="w-5 h-4 border-2 border-amber-600/30 rounded-sm" />
                      </div>
                    </div>
                  </div>

                  {/* Card Number with Reveal Button */}
                  <div className="mt-6">
                    <div className="flex items-center gap-3">
                      <p className="text-white font-mono text-xl sm:text-2xl tracking-[3px] sm:tracking-[4px] drop-shadow-lg">
                        {getDisplayCardNumber()}
                      </p>
                      <button
                        onClick={fetchFullCardDetails}
                        disabled={loadingCardDetails}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title={showFullCardNumber ? "Hide card number" : "Reveal card number"}
                      >
                        {loadingCardDetails ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : showFullCardNumber ? (
                          <EyeOff className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                        )}
                      </button>
                    </div>
                    {cardDetailsError && (
                      <p className="text-rose-400 text-xs mt-1">{cardDetailsError}</p>
                    )}
                  </div>

                  {/* Show CVC if available and revealed */}
                  {showFullCardNumber && fullCardCvc && (
                    <div className="mt-1 flex items-center gap-2">
                      <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">CVC:</p>
                      <p className="text-white font-mono text-sm">{fullCardCvc}</p>
                    </div>
                  )}

                  {/* Card Holder & Expiry */}
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                        Cardholder
                      </p>
                      <p className="text-white font-medium text-sm uppercase tracking-wider truncate">
                        {fullName}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                        Expires
                      </p>
                      <p className="text-white font-medium text-sm tracking-wider">
                        {formatExpiry(cardData.exp_month, cardData.exp_year)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Section */}
                <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider">
                      Spending Limit
                    </p>
                    <p className="text-white font-bold text-lg">
                      {formatAmount(cardData.spending_limit || 0)}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor(cardData.status)}`}>
                    {getStatusIcon(cardData.status)}
                    <span className="capitalize">{cardData.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/20 transition-all duration-300 text-sm font-medium text-rose-400 hover:text-rose-300"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Withdraw
                </button>
                <button
                  onClick={() => setShowRechargeModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/20 transition-all duration-300 text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  <ArrowDownRight className="w-4 h-4" />
                  Recharge
                </button>
              </div>

              {/* Quick Actions */}
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  onClick={() => copyToClipboard(cardData.stripe_card_id, 'card')}
                  className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all duration-300 text-sm font-medium text-gray-300 hover:text-white"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Copy Card ID</span>
                    </>
                  )}
                </button>
                <Link
                  href={`/cards/${cardData.id}/edit`}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/10 transition-all duration-300 text-sm font-medium text-white"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Edit Card</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column - Card Information - 3/5 */}
          <div className="lg:col-span-3">
            <div className="mb-4">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Information</span>
              <h2 className="text-2xl font-bold text-white mt-1">Card Details</h2>
            </div>
            
            <div className="space-y-4">
              {/* Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Brand</p>
                  <p className="text-white font-semibold mt-1 capitalize">{cardData.brand || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Type</p>
                  <p className="text-white font-semibold mt-1 capitalize">{cardData.card_type || 'Virtual'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Currency</p>
                  <p className="text-white font-semibold mt-1 uppercase">{cardData.currency || 'USD'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Funding</p>
                  <p className="text-white font-semibold mt-1 capitalize">{cardData.funding || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Last 4 Digits</p>
                  <p className="text-white font-semibold mt-1 font-mono">{cardData.last4 || 'N/A'}</p>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Spending Limit</p>
                  <p className="text-white font-semibold mt-1">{formatAmount(cardData.spending_limit || 0)}</p>
                </div>
              </div>

              {/* Billing Address */}
              {(cardData.address_line1 || cardData.address_city) && (
                <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Billing Address</h3>
                  </div>
                  <div className="text-sm text-gray-300 space-y-0.5">
                    {cardData.address_line1 && <p>{cardData.address_line1}</p>}
                    {cardData.address_city && (
                      <p>
                        {cardData.address_city}
                        {cardData.address_state && `, ${cardData.address_state}`}
                        {cardData.address_postal && ` ${cardData.address_postal}`}
                      </p>
                    )}
                    {cardData.address_country && <p>{cardData.address_country}</p>}
                  </div>
                </div>
              )}

              {/* Created Date */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Issued</h3>
                </div>
                <p className="text-sm text-gray-300">
                  {cardData.created_at ? new Date(cardData.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'N/A'}
                </p>
              </div>

              {/* Card ID */}
              <div className="bg-white/5 rounded-xl p-5 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Card ID</h3>
                    </div>
                    <p className="text-sm font-mono text-gray-300">{cardData.id}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(cardData.id, 'id')}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {copiedCardId ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</span>
              <h2 className="text-2xl font-bold text-white mt-1">Transaction History</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Debits
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Credits
              </span>
            </div>
          </div>

          {isLoading ? (
            <LoadingSkeleton />
        
          ) : transactionError ? (
            <div className="bg-white/5 rounded-2xl border border-white/5 p-12 text-center">
              <p className="text-gray-400">Unable to load transactions</p>
              <p className="text-gray-500 text-sm mt-1">{transactionError}</p>
              <button
                onClick={() => {
                  setIsLoading(false);
                  fetchTransactions().finally(() => setIsLoading(true));
                }}
                className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white/5 rounded-2xl border border-white/5 p-16 text-center">
              <div className="text-5xl mb-4 opacity-30">💳</div>
              <h3 className="text-lg font-medium text-white mb-1">No Transactions Yet</h3>
              <p className="text-gray-400 text-sm">This card hasn't been used for any transactions.</p>
            </div>
          ) : (
            <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {transactions.map((transaction, index) => {
                      const isDebit = transaction.amount < 0 || 
                        ['payment', 'purchase', 'debit', 'withdrawal'].includes(transaction.type?.toLowerCase());
                      
                      return (
                        <tr key={transaction.id || index} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-200">
                              {transaction.created_at 
                                ? new Date(transaction.created_at).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'N/A'
                              }
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.created_at 
                                ? new Date(transaction.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''
                              }
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-200">
                              {transaction.description || transaction.name || 'Transaction'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.merchant || transaction.category || ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                              {getTransactionIcon(transaction.type)}
                              {transaction.type || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-medium ${isDebit ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {isDebit ? '-' : '+'}{formatAmount(Math.abs(transaction.amount))}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              ['completed', 'success'].includes(transaction.status?.toLowerCase())
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : transaction.status?.toLowerCase() === 'pending'
                                ? 'bg-amber-500/10 text-amber-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}>
                              {transaction.status || 'Completed'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal - High z-index */}
      {showWithdrawModal && (
        <ActionModal
          isOpen={showWithdrawModal}
          onClose={() => {
            setShowWithdrawModal(false);
            setActionError(null);
            setActionSuccess(false);
            setAmount("");
            setDescription("");
          }}
          onConfirm={handleWithdraw}
          title="Withdraw Funds"
          icon={<ArrowUpRight className="w-5 h-5 text-rose-400" />}
          buttonText="Confirm Withdrawal"
          buttonColor="bg-rose-500 hover:bg-rose-600"
          processing={processing}
          actionSuccess={actionSuccess}
          actionError={actionError}
          amount={amount}
          setAmount={setAmount}
          description={description}
          setDescription={setDescription}
        />
      )}

      {/* Recharge Modal - High z-index */}
      {showRechargeModal && (
        <ActionModal
          isOpen={showRechargeModal}
          onClose={() => {
            setShowRechargeModal(false);
            setActionError(null);
            setActionSuccess(false);
            setAmount("");
            setDescription("");
          }}
          onConfirm={handleRecharge}
          title="Recharge Card"
          icon={<ArrowDownRight className="w-5 h-5 text-emerald-400" />}
          buttonText="Confirm Recharge"
          buttonColor="bg-emerald-500 hover:bg-emerald-600"
          processing={processing}
          actionSuccess={actionSuccess}
          actionError={actionError}
          amount={amount}
          setAmount={setAmount}
          description={description}
          setDescription={setDescription}
        />
      )}
    </div>
  );
}