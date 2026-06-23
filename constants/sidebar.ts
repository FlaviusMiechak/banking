// constants/sidebar.ts

export const getSidebarLinks = (cardId?: string) => [
  {
    imgURL: "/icons/home.svg",
    route: "/",
    label: "Home",
  },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/my-banks",
    label: "My Banks",
  },
  {
    imgURL: "/icons/transaction.svg",
    route: "/transaction-history",
    label: "Transaction History",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/payment-transfer",
    label: "Transfer Funds",
  },
  {
    imgURL: "/icons/credit-card.svg",
    route: cardId ? `/cards/${cardId}` : "/cards",
    routes: '/cards',
    label: "Card Management",
  },
  {
    imgURL: "/icons/merchant.svg",
    route: "/merchant",
    label: "Merchant Pay",
  },
  {
    imgURL: "/icons/bonus.svg",
    route: "/rewards",
    label: "Rewards",
  },
  {
    imgURL: "/icons/settings.svg",
    route: "/settings",
    label: "Settings",
  },
];