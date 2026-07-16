import { formatAmount } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Copy from "./Copy";

interface BankCardProps {
  account: {
    id: string;
    name: string;
    currentBalance: number;
    mask?: string;
    shareableId?: string;
    expMonth?: number;
    expYear?: number;
    brand?: string;
    type?: string;
    status?: string;
    cardNumber?: string;
  };
  userName: string;
  showBalance?: boolean;
  compact?: boolean;
}

const BankCard = ({
  account,
  userName,
  showBalance = true,
  compact = false,
}: BankCardProps) => {
  // Format expiry date
  const formatExpiry = (month?: number, year?: number) => {
    if (!month || !year) return "●● / ●●";
    const monthStr = month.toString().padStart(2, '0');
    const yearStr = year.toString().slice(-2);
    return `${monthStr} / ${yearStr}`;
  };

  // Get card brand icon
  const getCardBrandIcon = (brand?: string) => {
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
  const getCardGradient = (brand?: string) => {
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
  const getStatusColor = (status?: string) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'inactive':
        return 'bg-amber-500/20 text-amber-400';
      case 'blocked':
      case 'canceled':
        return 'bg-rose-500/20 text-rose-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  // Format card number with proper spacing
  const formatCardNumber = (number?: string) => {
    if (!number) return "●●●● ●●●● ●●●● ●●●●";
    
    if (number.includes('●') || number.includes(' ')) {
      return number;
    }
    
    if (number.length === 4) {
      return `●●●● ●●●● ●●●● ${number}`;
    }
    
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.length === 16) {
      return cleanNumber.match(/.{4}/g)?.join(' ') || number;
    }
    
    return number;
  };

  const cardGradient = getCardGradient(account.brand);

  // Compact version for sidebar
  if (compact) {
    return (
      <Link
        href={`/cards/${account.id}`}
        className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-4 border border-white/5 transition-all duration-300 hover:border-white/20 hover:shadow-lg hover:shadow-blue-500/10 group block"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 relative">
              <Image
                src={getCardBrandIcon(account.brand)}
                width={40}
                height={24}
                alt={account.brand || "Card"}
                className="drop-shadow-lg"
              />
            </div>
            <div>
              <p className="text-white font-medium text-sm truncate max-w-[120px]">
                {account.name}
              </p>
              <p className="text-gray-400 text-xs font-mono">
                ●●●● ●●●● ●●●● {account.mask || "0000"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white font-semibold text-sm">
              {formatAmount(account.currentBalance)}
            </p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(account.status)}`}>
              {account.status || 'Active'}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Full-size card render
  return (
    <div className="flex flex-col group">
      <Link
        href={`/cards/${account.id}`}
        className="relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      >
        {/* Card Container with Gradient */}
        <div className={`relative bg-gradient-to-br ${cardGradient} p-6 min-h-[240px] flex flex-col justify-between shadow-2xl shadow-black/30 border border-white/5`}>
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          
          {/* Glossy Effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50" />

          {/* Card Content */}
          <div className="relative z-10 flex flex-col h-full">
            {/* Top Section: Brand & Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src={getCardBrandIcon(account.brand)}
                  width={48}
                  height={32}
                  alt={account.brand || "Card"}
                  className="drop-shadow-lg"
                />
                <span className="text-white/60 text-xs font-medium uppercase tracking-wider">
                  {account.brand || 'Card'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">
                  {account.type || 'Virtual'}
                </span>
                <Image
                  src="/icons/Paypass.svg"
                  width={24}
                  height={24}
                  alt="Paypass"
                  className="opacity-80"
                />
              </div>
            </div>

            {/* Card Number */}
            <div className="mt-4">
              <p className="text-white font-mono text-xl tracking-[3px] drop-shadow-md">
                {formatCardNumber(account.mask)}
              </p>
            </div>

            {/* Card Details */}
            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
                  Cardholder
                </p>
                <p className="text-white font-semibold text-sm uppercase tracking-wider drop-shadow-md truncate max-w-[140px]">
                  {account.name || userName || 'Cardholder'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
                  Expires
                </p>
                <p className="text-white font-semibold text-sm tracking-wider drop-shadow-md">
                  {formatExpiry(account.expMonth, account.expYear)}
                </p>
              </div>
            </div>

            {/* Bottom Section: Balance & Status */}
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">
                  {showBalance ? 'Balance' : 'Limit'}
                </p>
                <p className="text-white font-bold text-lg drop-shadow-md">
                  {formatAmount(account.currentBalance)}
                </p>
              </div>
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${getStatusColor(account.status)} border-white/10`}>
                  {account.status || 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Copy Link */}
      {showBalance && account.shareableId && (
        <div className="mt-2 px-2">
          <Copy title={account.shareableId} />
        </div>
      )}
    </div>
  );
};

export default BankCard;