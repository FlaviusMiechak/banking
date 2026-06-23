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
  };
  userName: string;
  showBalance?: boolean;
}

const BankCard = ({
  account,
  userName,
  showBalance = true,
}: BankCardProps) => {
  return (
    <div className="flex flex-col">
      <Link
        href={`/transaction-history?id=${account.id}`}
        className="bank-card"
      >
        <div className="bank-card_content">
          <div>
            <h1 className="text-16 font-semibold text-white">
              {account.name}
            </h1>

            <p className="font-ibm-plex-serif font-black text-white">
              {formatAmount(account.currentBalance)}
            </p>
          </div>

          <article className="flex flex-col gap-2">
            <div className="flex justify-between">
              <h2 className="text-12 font-semibold text-white">
                {userName}
              </h2>

              <span className="text-12 font-semibold text-white">
                ●● / ●●
              </span>
            </div>

            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●●{" "}
              <span className="text-16">
                {account.mask ?? "0000"}
              </span>
            </p>
          </article>
        </div>

        <div className="bank-card_icon">
          <Image
            src="/icons/Paypass.svg"
            width={20}
            height={24}
            alt="Paypass"
          />

          <Image
            src="/icons/mastercard.svg"
            width={45}
            height={32}
            alt="Mastercard"
            className="ml-5"
          />
        </div>

        <Image
          src="/icons/lines.png"
          width={316}
          height={190}
          alt=""
          className="absolute left-0 top-0"
        />
      </Link>

      {showBalance && account.shareableId && (
        <Copy title={account.shareableId} />
      )}
    </div>
  );
};

export default BankCard;