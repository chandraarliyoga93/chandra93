export interface MarketItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "profile" | "border" | "name" | "badge";
  color: string;
  icon: string;
}

export const MARKET_ITEMS: MarketItem[] = [
  {
    id: "ruby-profile",
    name: "Ruby Profile",
    description: "Tampilan profil merah delima yang bikin kamu kelihatan makin keren.",
    price: 500,
    category: "profile",
    color: "#e11d48", // rose-600
    icon: "💎",
  },
  {
    id: "gold-border",
    name: "Gold Border",
    description: "Bingkai emas murni buat avatarmu. Status paling elit!",
    price: 300,
    category: "border",
    color: "#fbbf24", // amber-400
    icon: "✨",
  },
  {
    id: "neon-name",
    name: "Neon Name",
    description: "Namamu bakal menyala kayak lampu neon yang keren.",
    price: 200,
    category: "name",
    color: "#22c55e", // green-500
    icon: "🌈",
  },
  {
    id: "diamond-badge",
    name: "Diamond Badge",
    description: "Badge paling rare yang pernah ada. Cuma buat yang beneran jago.",
    price: 1000,
    category: "badge",
    color: "#3b82f6", // blue-500
    icon: "💍",
  },
];
