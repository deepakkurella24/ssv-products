import type { Review } from "./types";

export const SEED_REVIEWS: Review[] = [
  // Cold Pressed Sesame Oil
  {
    id: "rev-sesame-1",
    product_id: "p-sesame-oil",
    order_id: "SSV-10112",
    user_name: "Priya Sharma",
    rating: 5,
    title: "Authentic aroma, pure quality",
    comment:
      "Reminds me of traditional wooden ghani oil from our hometown. Clean nutty taste and doesn't smoke when heated. We use it for daily cooking and idli podi.",
    created_at: "2026-10-18T10:30:00.000Z",
    verified_buyer: true,
    variant_label: "1 L",
  },
  {
    id: "rev-sesame-2",
    product_id: "p-sesame-oil",
    user_name: "Anand K.",
    rating: 5,
    title: "Excellent for oil pulling",
    comment:
      "I have been doing morning oil pulling with this oil for three weeks. It is very light, fresh and has no bitter aftertaste. Highly recommend.",
    created_at: "2026-09-24T14:15:00.000Z",
    verified_buyer: true,
    variant_label: "500 ml",
  },
  {
    id: "rev-sesame-3",
    product_id: "p-sesame-oil",
    user_name: "Meenakshi R.",
    rating: 4,
    title: "Well packed bottle, no leakage",
    comment:
      "Arrived in Coimbatore safely with bubble wrapping. The oil has a deep golden colour. Using it for tempering and pickles.",
    created_at: "2026-09-12T09:00:00.000Z",
    verified_buyer: true,
    variant_label: "1 L",
  },
  {
    id: "rev-sesame-4",
    product_id: "p-sesame-oil",
    user_name: "Karthik V.",
    rating: 5,
    title: "Real difference from refined oils",
    comment:
      "Switched away from commercial refined oils. Cooking feels much lighter and digestion is noticeably better. Happy with SSV quality.",
    created_at: "2026-08-30T16:45:00.000Z",
    verified_buyer: true,
    variant_label: "500 ml",
  },

  // Forest Honey
  {
    id: "rev-honey-1",
    product_id: "p-forest-honey",
    order_id: "SSV-10231",
    user_name: "Priya Sharma",
    rating: 5,
    title: "Natural crystallisation shows it is pure",
    comment:
      "Ordered the 500 g jar. It thickened slightly in cold mornings, which is normal for raw unheated honey. Mild herbal sweetness, not artificial sugar syrup.",
    created_at: "2026-10-25T11:20:00.000Z",
    verified_buyer: true,
    variant_label: "500 g",
  },
  {
    id: "rev-honey-2",
    product_id: "p-forest-honey",
    user_name: "Deepa M.",
    rating: 5,
    title: "My parents love this",
    comment:
      "Got this for my father who drinks warm lemon water daily. He immediately noticed the difference in taste and throat comfort.",
    created_at: "2026-10-04T08:10:00.000Z",
    verified_buyer: true,
    variant_label: "250 g",
  },
  {
    id: "rev-honey-3",
    product_id: "p-forest-honey",
    user_name: "Ramesh S.",
    rating: 4,
    title: "Thick consistency and rich taste",
    comment:
      "Good dark colour with a distinct floral and woody note. Glass jar packing was clean and sturdy.",
    created_at: "2026-09-18T17:30:00.000Z",
    verified_buyer: true,
    variant_label: "500 g",
  },

  // Turmeric Powder
  {
    id: "rev-turmeric-1",
    product_id: "p-turmeric-powder",
    user_name: "Lakshmi N.",
    rating: 5,
    title: "A small pinch is enough",
    comment:
      "Deep natural yellow colour without artificial dyes. The aroma when added to warm oil is unmistakable. Only a pinch is needed for rasam.",
    created_at: "2026-10-20T12:00:00.000Z",
    verified_buyer: true,
    variant_label: "200 g",
  },
  {
    id: "rev-turmeric-2",
    product_id: "p-turmeric-powder",
    user_name: "Venkatesh P.",
    rating: 5,
    title: "Great for turmeric milk at night",
    comment:
      "No bitterness or chalky residue at the bottom of the glass. Dissolves cleanly with hot milk and black pepper.",
    created_at: "2026-09-15T19:40:00.000Z",
    verified_buyer: true,
    variant_label: "200 g",
  },

  // Red Chilli Powder
  {
    id: "rev-chilli-1",
    product_id: "p-red-chilli-powder",
    user_name: "Geetha B.",
    rating: 5,
    title: "Real clean heat, no artificial colour",
    comment:
      "Properly hot so start with half your usual measure. Food gets authentic flavour without staining hands neon red like packet powders.",
    created_at: "2026-10-08T15:20:00.000Z",
    verified_buyer: true,
    variant_label: "250 g",
  },
  {
    id: "rev-chilli-2",
    product_id: "p-red-chilli-powder",
    user_name: "Rajesh T.",
    rating: 4,
    title: "Fresh aroma and spicy punch",
    comment:
      "Fine texture and smells of sun-dried chillies. Gives very good heat to chicken and vegetable gravies.",
    created_at: "2026-09-02T13:10:00.000Z",
    verified_buyer: true,
    variant_label: "250 g",
  },

  // Black Sesame Oil
  {
    id: "rev-black-1",
    product_id: "p-black-sesame-oil",
    user_name: "Sangeetha G.",
    rating: 5,
    title: "Traditional dark oil, hard to find",
    comment:
      "Has the rich, dark colour and concentrated nutty aroma. We use it for therapeutic oil massage and traditional preparations.",
    created_at: "2026-09-28T10:10:00.000Z",
    verified_buyer: true,
    variant_label: "500 ml",
  },

  // Coconut Oil
  {
    id: "rev-coconut-1",
    product_id: "p-coconut-oil",
    user_name: "Preeti D.",
    rating: 5,
    title: "Unbleached and smells fresh",
    comment:
      "Clear oil with clean sweet coconut scent. We use it both for cooking aviyal and as daily hair oil. Absolutely pure.",
    created_at: "2026-10-14T11:45:00.000Z",
    verified_buyer: true,
    variant_label: "500 ml",
  },

  // Pure Camphor
  {
    id: "rev-camphor-1",
    product_id: "p-camphor",
    user_name: "Raghavan V.",
    rating: 5,
    title: "Zero soot on brass pooja plate",
    comment:
      "Burns completely leaving no black carbon mark on our brass aarti plate. The fragrance during evening prayer is very peaceful.",
    created_at: "2026-10-10T18:00:00.000Z",
    verified_buyer: true,
    variant_label: "100 g",
  },

  // Dhoop Sticks
  {
    id: "rev-dhoop-1",
    product_id: "p-dhoop-sticks",
    order_id: "SSV-10231",
    user_name: "Priya Sharma",
    rating: 5,
    title: "Earthy aroma without choking smoke",
    comment:
      "Normal incense makes us sneeze, but this herbal dhoop has a mild temple-like woody fragrance that lingers gently for hours.",
    created_at: "2026-10-26T07:30:00.000Z",
    verified_buyer: true,
    variant_label: "100 g",
  },
  {
    id: "rev-dhoop-2",
    product_id: "p-dhoop-sticks",
    user_name: "Suresh M.",
    rating: 4,
    title: "Calming morning fragrance",
    comment: "Natural herbal scent. Sticks burn steadily for about 35 minutes.",
    created_at: "2026-09-19T08:00:00.000Z",
    verified_buyer: true,
    variant_label: "100 g",
  },
];

export interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  percentages: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function calculateRatingSummary(reviews: Review[]): RatingSummary {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (reviews.length === 0) {
    return {
      average: 0,
      count: 0,
      distribution,
      percentages: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  let sum = 0;
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[star] = (distribution[star] || 0) + 1;
    sum += r.rating;
  }

  const count = reviews.length;
  const average = Math.round((sum / count) * 10) / 10;
  const percentages: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: Math.round((distribution[1] / count) * 100),
    2: Math.round((distribution[2] / count) * 100),
    3: Math.round((distribution[3] / count) * 100),
    4: Math.round((distribution[4] / count) * 100),
    5: Math.round((distribution[5] / count) * 100),
  };

  return { average, count, distribution, percentages };
}
