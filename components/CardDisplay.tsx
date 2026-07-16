import { formatAmount } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import Copy from "./Copy";

interface CardDisplayProps {
  card: {
    id: string;
    bank_id: string;
    user_id: string;
    stripe_card_id: string;
    stripe_cardholder_id: string;
    stripe_customer_id: string | null;
    brand: string | null;
    last4: string | null;
    exp_month: number | null;
    exp_year: number | null;
    card_type: string | null;
    funding: string | null;
    currency: string | null;
    status: string | null;
    spending_limit: number | null;
    billing_address: any;
    created_at: string;
    updated_at: string;
    address_state: string | null;
    address_country: string | null;
    address_city: string | null;
    address_line1: string | null;
    address_postal: string | null;
    cardholder_name: string | null;
  };
  userName: string;
  showBalance?: boolean;
}

const CardDisplay = ({ card, userName, showBalance = true }: CardDisplayProps) => {
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

  // Get card type label
  const getCardTypeLabel = (type?: string | null) => {
    if (!type) return 'Virtual';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  // Get card status color
  const getStatusColor = (status?: string | null) => {
    const statusLower = status?.toLowerCase() || '';
    switch (statusLower) {
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'inactive':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'blocked':
      case 'canceled':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  // Generate masked card number (show last 4)
  const getMaskedCardNumber = () => {
    const last4 = card.last4 || '0000';
    return `•••• •••• •••• ${last4}`;
  };

  return (
    <div className="flex flex-col">
      <Link
        href={`/card-details?id=${card.id}`}
        className="bank-card relative overflow-hidden"
      >
        <div className="bank-card_content relative z-10">
          <div>
            {/* Card Type and Brand */}
            <div className="flex items-center justify-between">
              <h1 className="text-16 font-semibold text-white">
                {card.cardholder_name || 'Cardholder'}
              </h1>
              <span className="text-10 font-medium text-white/70 uppercase tracking-wider">
                {getCardTypeLabel(card.card_type)}
              </span>
            </div>

            {/* Card Number */}
            <p className="text-18 font-semibold tracking-[2px] text-white mt-3">
              {getMaskedCardNumber()}
            </p>

            {/* Card Details Row */}
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-10 font-medium text-white/50 uppercase tracking-wider">
                  Expires
                </p>
                <p className="text-14 font-semibold text-white">
                  {formatExpiry(card.exp_month, card.exp_year)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-10 font-medium text-white/50 uppercase tracking-wider">
                  Status
                </p>
                <span className={`text-11 font-semibold px-2 py-0.5 rounded-full ${getStatusColor(card.status)}`}>
                  {card.status || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Balance/Spending Limit */}
            {showBalance && card.spending_limit !== null && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-10 font-medium text-white/50 uppercase tracking-wider">
                  Spending Limit
                </p>
                <p className="text-16 font-black text-white">
                  {formatAmount(card.spending_limit)}
                </p>
              </div>
            )}
          </div>

          <article className="flex flex-col gap-2 mt-3">
            <div className="flex justify-between">
              <h2 className="text-11 font-semibold text-white/70 uppercase tracking-wider">
                {userName}
              </h2>
            </div>
          </article>
        </div>

        <div className="bank-card_icon relative z-10">
          <Image
            src="/icons/Paypass.svg"
            width={20}
            height={24}
            alt="Paypass"
          />

          <Image
            src={getCardBrandIcon(card.brand)}
            width={45}
            height={32}
            alt={card.brand || "Mastercard"}
            className="ml-5"
          />
        </div>

        <Image
          src="/icons/lines.png"
          width={316}
          height={190}
          alt=""
          className="absolute left-0 top-0 z-0"
        />
      </Link>

      {/* Card Details Footer */}
      <div className="mt-2 px-2 flex items-center justify-between text-xs text-gray-500">
        <span>ID: {card.stripe_card_id?.slice(-8) || '••••'}</span>
        <span>{card.currency?.toUpperCase() || 'USD'}</span>
        {card.stripe_card_id && (
          <Copy title={card.stripe_card_id} />
        )}
      </div>
    </div>
  );
};

export default CardDisplay;