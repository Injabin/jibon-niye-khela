/**
 * Religion-aware funeral rite events (Part D). These are injected by the store
 * when a family member dies during ageFamilyMembers — never drawn from the
 * registry — so each death presents a respectful, tiered choice with realistic
 * Dhaka burial/cremation locations.
 *
 * NATIVE REVIEW GATE: the locations, costs, and Bangla wording below are the
 * author-approved draft; review before shipping (init.md §2.3).
 */

import type { LifeEventDef } from '@/lib/engine/types';

export interface FallenRelative {
  /** Full name of the deceased. */
  name: string;
  /** Bangla household label, e.g. "আম্মা", "বউ (স্ত্রী)", "মেয়ে". */
  roleLabel: string;
  /** Character's own religion drives the rite (Muslim vs Hindu). */
  religion: 'islam' | 'hinduism';
}

export function buildFuneralEvent(fallen: FallenRelative): LifeEventDef {
  const { name, roleLabel, religion } = fallen;

  if (religion === 'hinduism') {
    return {
      id: `funeral_hindu_${name}`,
      text: `${roleLabel} ${name} শেষ নিঃশ্বাস ত্যাগ করিলো। ঘরে শোকে সোয়াস্তি, শ্মশানে যাইবার আগে দাহ-সংস্কারের সিদ্ধান্ত নিতে হইলো।`,
      minAge: 0,
      maxAge: 130,
      weight: 100,
      tone: 'neutral',
      category: 'adult',
      tags: ['family', 'death', 'rite'],
      choices: [
        {
          id: 'funeral_hindu_budget',
          text: 'সহজ দাহ — পোস্তা শ্মশানে রীতি-মতো মুখাগ্নি ও দাহ করো',
          effects: { money: -15, karma: 6, happiness: -10 },
          outcomeText: `পোস্তা শ্মশানে পূর্ণ রীতি-মতো দাহ সম্পন্ন হইলো। আগুনে লাশ রূপান্তরিত হওয়ার মুহূর্তে "রাম নাম সত্য" ধ্বনিতে বুকটা হালকা হইলো। ছাই গঙ্গায় নিয়া মা-পিতাকে স্মরণ করলি।`,
          tone: 'neutral',
        },
        {
          id: 'funeral_hindu_standard',
          text: 'মাঝারি রীতি — রায়ের বাজার মহানগর শ্মশানে দাহ + ত্রয়োদশ শ্রাদ্ধ',
          effects: { money: -40, karma: 10, happiness: -6 },
          outcomeText: `রায়ের বাজার মহানগর শ্মশানে দাহ ও ত্রয়োদশ শ্রাদ্ধ করা হইলো। আত্মীয়গণ গঙ্গাজল ছিটাইয়া আর্শিবাদ দিলো, মনে হইলো ${roleLabel} ${name}-র আত্মার শান্তি নিশ্চিত হইলো।`,
          tone: 'neutral',
        },
        {
          id: 'funeral_hindu_premium',
          text: 'উন্নত রীতি — সম্পূর্ণ বৈদিক আচার, ব্রাহ্মণ পূজা, পিণ্ডদান ও গো-দান',
          effects: { money: -80, karma: 16, happiness: -3 },
          outcomeText: `পাঁচ জনের বৈদিক পণ্ডিত দিয়া পূর্ণাঙ্গ শ্রাদ্ধ, পিণ্ডদান এবং পশ্চাত দেওয়া হইলো। গো-দান আর এতিমের অন্নের ব্যবস্থা করলে ${roleLabel} ${name}-র আত্মার শান্তির লাইগা সকলের বিবেক তুষ্ট হইলো। পুষ্পাঞ্জলির পর ঘরে বেজে উঠিলো শান্তির মন্ত্র।`,
          tone: 'neutral',
        },
      ],
    };
  }

  return {
    id: `funeral_muslim_${name}`,
    text: `${roleLabel} ${name} গতাইলা। জানাজার লাইগা যাওয়ার আগেই দাফন-কাফনের সিদ্ধান্ত নিতে হইলো। গোইর খেয়াল রাখা — এহন ওদের আখেরাতের ঘরে যাইবার ব্যবস্থা।`,
    minAge: 0,
    maxAge: 130,
    weight: 100,
    tone: 'neutral',
    category: 'adult',
    tags: ['family', 'death', 'rite'],
    choices: [
      {
        id: 'funeral_muslim_budget',
        text: 'সাধারণ দাফন — আজিমপুর কবরস্থানে জানাজা পড়াইয়া ঠিকঠাক কবর দাও',
        effects: { money: -15, karma: 6, happiness: -10 },
        outcomeText: `আজিমপুর কবরস্থানে নামাজে জানাজা পড়ানো হইলো। সবাই ভরপুর কান্নায় মাগফিরাত চাইলো। কবরের মাটি দেওয়ার পর দুআ করলি — চোখের পানি মুইছাইয়া ${roleLabel} ${name}-রে সম্মান দিয়া বিদায় দিলা।`,
        tone: 'neutral',
      },
      {
        id: 'funeral_muslim_standard',
        text: 'মাঝারি — বনানী কবরস্থানে জানাজা, কবর জিয়ারত, খতম ও মিলাদ',
        effects: { money: -40, karma: 10, happiness: -6 },
        outcomeText: `বনানী কবরস্থানে জানাজা ও কবর দেওয়া শেষে সপ্তাহখানেক ধরে খতম ও মিলাদ শরিফ পড়ানো হইলো। পাড়ার মুসল্লিরা সবাই সংসার-সম্বল মিলাইয়া দোয়া করলো, মনের ভার খানিক নামলো।`,
        tone: 'neutral',
      },
      {
        id: 'funeral_muslim_premium',
        text: 'উন্নত — মিরপুর শাহী কবরস্থানে কবর বুকিং, চল্লিশা ও এতিমখানায় খাবার বিতরণ',
        effects: { money: -80, karma: 16, happiness: -3 },
        outcomeText: `মিরপুর শাহী কবরস্থানে কায়েমি কবরের বুকিং করা হইলো। চল্লিশা পড়াইয়া এতিমখানা ও পাড়ার দুঃস্থদের খাবারের ব্যবস্থা করলি। ${roleLabel} ${name}-র আত্মার মাগফিরাতের লাইগা সবশেষে সকলে মিলিয়া দুআ করলো — ইন্নালিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন।`,
        tone: 'neutral',
      },
    ],
  };
}