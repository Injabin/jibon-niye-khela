/**
 * Asset purchase catalog — concrete purchasable items per AssetKind, each
 * with a Bangla name and a price in game currency. Used by the AssetsTab
 * UI so the player chooses exactly which item to buy instead of receiving
 * a random asset from the legacy NAMES pool.
 */

import type { AssetKind } from '@/lib/engine/types';

export interface AssetListing {
  id: string;
  kind: AssetKind;
  name: string;
  price: number;
}

export const ASSET_CATALOG: Record<AssetKind, readonly AssetListing[]> = {
  car: [
    { id: 'car_honda_dio', kind: 'car', name: 'হোন্ডা ডায়ো স্কুটার', price: 4_500 },
    { id: 'car_yamaha_fzs', kind: 'car', name: 'ইয়ামাহা এফজেড-এস বাইক', price: 7_200 },
    { id: 'car_honda_lifan', kind: 'car', name: 'লিফান ১৫০ সিসি বাইক', price: 9_800 },
    { id: 'car_toyota_corolla', kind: 'car', name: 'টয়োটা করোলা', price: 32_000 },
    { id: 'car_honda_civic', kind: 'car', name: 'হোন্ডা সিভিক', price: 45_000 },
    { id: 'car_toyota_prado', kind: 'car', name: 'টয়োটা ল্যান্ড ক্রুজার প্রাডো', price: 85_000 },
  ],
  home: [
    { id: 'home_slum_room', kind: 'home', name: 'কোয়ার্টারে একটা রুম', price: 18_000 },
    { id: 'home_old_dhaka_flat', kind: 'home', name: 'পুরান ঢাকার দুই রুমের ফ্লাট', price: 55_000 },
    { id: 'home_mirpur_flat', kind: 'home', name: 'মিরপুরের তিন রুমের ফ্ল্যাট', price: 90_000 },
    { id: 'home_dhanmondi_flat', kind: 'home', name: 'ধানমন্ডির বিলাসবহুল ফ্ল্যাট', price: 180_000 },
    { id: 'home_banani_apt', kind: 'home', name: 'বনানীর লাক্সারি অ্যাপার্টমেন্ট', price: 320_000 },
    { id: 'home_villa', kind: 'home', name: 'গুলশানের দোতলা ভিলা', price: 600_000 },
  ],
  jewelry: [
    { id: 'jewelry_silver_ring', kind: 'jewelry', name: 'রূপার আংটি', price: 350 },
    { id: 'jewelry_bracelet', kind: 'jewelry', name: 'রূপার ব্রেসলেট', price: 800 },
    { id: 'jewelry_gold_chain', kind: 'jewelry', name: 'সোনার চেইন', price: 1_500 },
    { id: 'jewelry_gold_necklace', kind: 'jewelry', name: 'সোনার নেকলেস সেট', price: 3_200 },
    { id: 'jewelry_wedding_set', kind: 'jewelry', name: 'বিয়ের সোনার গহনা প্যাক', price: 8_000 },
  ],
  collectible: [
    { id: 'col_kansha_plate', kind: 'collectible', name: 'পুরান ঢাকার কাঁসার থালা', price: 200 },
    { id: 'col_vintage_coins', kind: 'collectible', name: 'ব্রিটিশ আমলের কয়েন সেট', price: 450 },
    { id: 'col_kite', kind: 'collectible', name: 'ভিন্টেজ ফিরিঙ্গির ঘুড়ি', price: 800 },
    { id: 'col_poster_71', kind: 'collectible', name: '১৯৭১ সালের ঐতিহাসিক পোস্টার', price: 1_200 },
    { id: 'col_puthi', kind: 'collectible', name: 'দুর্লভ পালাগানের পুস্তক সংগ্রহ', price: 2_500 },
  ],
  stock: [
    { id: 'stock_bluechip', kind: 'stock', name: 'মতিঝিল স্টক এক্সচেঞ্জের ব্লু-চিপ শেয়ার', price: 1_000 },
    { id: 'stock_pharma', kind: 'stock', name: 'বড় ওষুধ কোম্পানির লভ্যাংশ শেয়ার', price: 2_500 },
    { id: 'stock_bond', kind: 'stock', name: 'পাওয়ার ও গ্রিড কোম্পানির বন্ড', price: 5_000 },
    { id: 'stock_ipo', kind: 'stock', name: 'নতুন আইপিওতে লটারি শেয়ার', price: 8_000 },
  ],
  crypto: [
    { id: 'crypto_doge', kind: 'crypto', name: 'ডগকয়েন', price: 200 },
    { id: 'crypto_shiba', kind: 'crypto', name: 'শিবা ইনু', price: 400 },
    { id: 'crypto_eth', kind: 'crypto', name: 'ইথারিয়াম', price: 1_800 },
    { id: 'crypto_btc', kind: 'crypto', name: 'বিটকয়েন', price: 5_000 },
    { id: 'crypto_portfolio', kind: 'crypto', name: 'মিশ্র ক্রিপ্টো পোর্টফোলিও', price: 10_000 },
  ],
} as const;

export const ASSET_KIND_LABELS: Record<AssetKind, string> = {
  car: 'গাড়ি / বাইক',
  home: 'বাড়ি / ফ্ল্যাট',
  jewelry: 'সোনার গহনা',
  collectible: 'শখের জিনিস',
  stock: 'শেয়ার মার্কেট',
  crypto: 'ডিজিটাল সম্পদ',
};
