# BitLife — Complete Feature & Systems Breakdown

> This document is a complete functional/logical breakdown of every system, menu, and sub-menu in the BitLife game, and how they connect to each other. It is not code, but a game-design level map of "what options exist, what they do, and what they connect to." It can be used as a reference checklist when creating a localized Dhakaiya Bangla version.

---

## 0. Core Game Loop

BitLife is a **turn-based text/menu-driven life simulator**. The core loop:

1. Character is created (birth).
2. Every year (turn), the player takes some **Activities/Decisions**.
3. Pressing the "**Age**" button advances time by 1 year, triggers random events, and updates stats.
4. This cycle continues until the character dies (due to old age, illness, accident, murder, suicide, death penalty, etc.).
5. After death, a **Life Summary / Obituary** screen appears, and a new life can be started (can also continue as the next generation through a child's life — "Legacy" feature).

All features are integrated into this loop — every menu is essentially a category of "what you can do this year."

---

## 1. Character Creation

Set before/at birth:

- **Gender** — Male / Female (a random child appearance is generated)
- **Birthplace (Country/City)** — The player can choose which country/city to be born in (this affects each country's laws, career availability, immigration rules, etc.)
- **Name** — Randomly generated or custom set, can also be changed later (legally change name)
- **Family Setup** — Randomly determined: parents rich/poor, married/unmarried/divorced, number of siblings, probability of being adopted
- **Starting Stats** — A base for Health/Smarts/Looks is randomly generated at birth, Wealth starts based on the family's financial condition
- **Special Talent (in some versions)** — A special talent (e.g., in music, acting, crime, sports) may be assigned at birth, which makes progression in specific career paths easier later on

**Connection:** All these starting values act as the initial base for schools, jobs, and relationships later on.

---

## 2. Core Stats System

Always visible at the top of the screen:

| Stat | What it Controls | How it Increases/Decreases |
|---|---|---|
| **Happiness** | Mental health, risk of depression/suicide | Increases from good events, activities (vacation, gym, family time); decreases from bad events |
| **Health** | Risk of death, immunity | Doctor visits, gym, diet; decreases with aging/accidents/illnesses |
| **Smarts** | School/Career opportunities | Studying, library; decreases if skipping school |
| **Looks** | Dating/relationship success, some careers (modeling, acting) | Cosmetic surgery, gym, fashion shopping; naturally decreases with age |
| **Karma** | Record of good/bad deeds, unlocks specific ribbons/achievements | Good deeds (charity, helping) increase it; crime/lying decrease it |
| **Wealth/Bank Balance** | Shopping, assets, standard of living | Salary, investments, inheritance; decreases from expenses/fines |

**Connection:** Every sub-option in every menu essentially increases/decreases a combination of these stats. Example — going to the gym → Health↑, Happiness↑, costs a little time; but going to the gym instead of working might cause Job performance↓ (trade-off system).

---

## 3. Life Stages — unlocks different menus at each stage

1. **Baby (0–2)** — Very limited options: interactions with parents (being held, changing name), illness events, chance of adoption
2. **Toddler (3–4)** — Playing, preschool starts
3. **Child (5–11)** — Grade school, making friends, extracurriculars start, bullying events, asking for pets
4. **Teen (12–17)** — High school, part-time jobs, dating begins, opportunities for crime begin, driving license, social cliques (Nerd/Jock/Prep, etc.)
5. **Young Adult/Adult (18+)** — Full menu unlocks: University, full-time jobs, marriage, children, buying property, voting, all types of crime, military
6. **Senior (60+)** — Retirement, grandchildren, increased health issues, creating a Will (deciding who gets the assets), Retirement home

**Connection:** Every feature is gated with a specific age-threshold — meaning when designing each sub-system, information on "unlocks at which age" is also required.

---

## 4. Main Navigation — Bottom Menu Tabs

Usually, there are 5-6 main tabs:

~~~text
[Age Button]  [Activities]  [Relationships]  [Occupation]  [Assets]  [Menu/Settings]
~~~

Below is a detailed breakdown of every sub-system inside each tab.

---

## 5. TAB: Activities — The largest category

This tab contains sub-categories:

### 5.1 Mind & Body
- **Gym** → Health↑ Looks↑ Happiness↑ (Multiple sub-styles: Cardio, Weightlifting)
- **Library** → Smarts↑
- **Meditate** → Happiness↑ ↑ Health slightly
- **Yoga** → Happiness↑ Health↑
- **Doctor** → Diagnosis/Treatment, Health check-up
- **Dentist** → Looks/Health maintenance
- **Therapist/Psychiatrist** → Happiness recovery, treating mental illnesses
- **Plastic Surgeon** — Contains sub-options:
  - Nose job, Face lift, Liposuction, Botox, Breast surgery, Hair transplant, etc. — each has different costs, Looks increases, and risks (chance of surgery failing)
- **Tattoo Parlor** → Modifies Looks (cosmetic, low stat impact, style/flavor)
- **Piercing Parlor** → Similar cosmetic impact
- **Fashion/Clothes shopping** → Looks↑, costs money
- **Diet Plans** → Health/Looks maintenance, long-term effects
- **Vacation** → Select country → Happiness↑, costs money, occasional special events (accidents/romance)
- **Museum, Zoo, Amusement Park visits** → Happiness↑ in small amounts

### 5.2 Crime
- **Petty crime:** Pickpocket, Shoplift
- **Property crime:** Burglary (target selection, time selection system), Grand Theft Auto, Arson
- **Violent crime:** Assault, Murder, Kidnapping
- **White-collar crime:** Fraud, Counterfeiting, Cybercrime/Hacking, Blackmail, Bribery
- For every crime: Success rate (%) is shown (depends on Smarts, Looks, Age), if successful money/items are gained; if failed or caught, sent to the **Prison System**

### 5.3 Love/Romance-related activities (In some versions under Activities, in others under Relationships)
- **Dating App** → List of potential partners, swipe/select
- **Speed Dating**
- **Hire an escort / Sugar dating**
- **Mail-order spouse**
- **Arranged Marriage** (culture-specific sub-system)

### 5.4 World Travel/Immigration
- Vacation vs **Emigrate (permanent migration)** — Visa/Citizenship system, language barriers
- Deportation risk (if illegal)

### 5.5 Pets
- Adopt, Buy
- Select species (Dog, Cat, Bird, Fish, Exotic animals)
- Feed, Play, Vet visit, Name change
- Pet death triggers Happiness↓ event

### 5.6 Special Careers (Launch points) — Detailed in Section 8

---

## 6. TAB: Relationships

This tab features a list — each person (character) is an entry:

### 6.1 Family
- **Parents:** Talk, Compliment, Insult, Hug, Gift, Ask for money, Move out/Move back in, Disown/Reconcile, Argue — about specific topics (career choice, lifestyle)
- **Siblings:** Similar interactions + Sibling rivalry events
- **Spouse:** Date, Propose, Marry (Marriage types: Normal, arranged, quick Vegas-style), Divorce (including asset division sub-system), Cheat, Have a baby (Try for baby → includes IVF/adoption alternatives)
- **Children:** Parenting style selection (Strict/Balanced/Uninvolved), help with studies, Discipline, provide College fund, inheritance
- **Grandchildren, Nieces/Nephews, In-laws** — Similar patterns with limited interactions
- **Exes** — Past relationships, occasional events where they reach out again

### 6.2 Social Circle
- **Friends:** Hang out, declare Best Friend, Gift, Borrow/Lend money
- **Enemies/Rivals:** Prank, Fight, Reconcile
- **Coworkers/Boss/HR** (In some versions, this is also inside the Job tab)

**For each person:** Relationship meter (%), Age, their own Happiness/Health/Job — meaning every NPC is essentially a mini-character with their own tracked stats.

---

## 7. TAB: Occupation (School/Job)

This tab changes depending on age:

### 7.1 School System
- **Preschool → Grade School → High School → University/College → Grad School/Vocational School**
- In each:
  - Study Harder (Smarts↑)
  - Skip class (Risk: getting caught)
  - Cheat on test (Risk: expulsion)
  - Extracurricular activities/Clubs (Debate, Drama, Sports team, Band) — these boost specific stats and affect future career/college admissions
  - Social Cliques (Prep, Nerd, Jock, Loner, etc.) — joining provides specific pros/cons
  - Prom (in High School) — Finding a date, Prom King/Queen event
  - Bully / Get Bullied event chains
  - Fraternity/Sorority (in University) — Joining, Hazing events
  - Major/Degree selection (University) — determines future job availability
  - Drop out — risky but possible

### 7.2 Job System
- **Job Search:** Categorized lists (Entry-level, Professional, etc.), Apply → Interview (mini success%) → Hired/Rejected
- **Job Recruiter** for finding jobs quickly (often a premium feature)
- **Part-time vs Full-time**
- **Side Hustle/Gig work** — alternative freelance income sources
- While employed:
  - Work Harder (Performance↑, Promotion chance↑)
  - Ask for raise/promotion (Boss-dependent success%)
  - Call in sick
  - Quit / Get fired (if performance is low or random event)
  - Union activities (in some jobs)
  - Coworker/Boss/HR interactions (gossip, romance, reporting)
- **Retirement** — retiring when older, Pension system

**Connection:** School's Smarts/Degree directly determines which jobs are unlocked (e.g., medical school is required to become a doctor).

---

## 8. Special Careers — Each its own sub-game

These are different from regular jobs; each has its own progression system:

- **Actor/Actress:** Acting class → Audition → Small roles → TV/Movie roles → Fame meter → Award show (Oscar-like)
- **Musician:** Learn instrument → Practice → Street perform → Sign record label → Album release → Tour → Fame
- **Author:** Writing class → Short stories → Write novel → Find publisher → Try for bestseller
- **Model:** Modeling agency → Photoshoot → Runway → Fame
- **Professional Athlete:** Select sport → Try out → Team → League progression → Championship
- **Social Media Influencer/Streamer:** Create content, Increase follower count, Sponsorships
- **CEO/Business path:** Climb corporate ladder → Start own company → Hire employees → Business decisions
- **Politician:** Local office → Mayor → Governor/MP → President/PM — Election system (campaign, debate, vote%)
- **Royal:** Enter royalty by marriage or chance, royal duties, line of succession
- **Military:** Enlist → Basic training → Rank progression → Combat missions/deployment
- **Doctor/Lawyer/Engineer etc. professional paths:** Degree-based, specific professional events (surgery success/fail, winning/losing cases)
- **Mafia/Organized Crime:** Join, ranks (Associate → Soldier → Capo → Boss), Loyalty/Respect stats
- **Cartel/Dealer:** Take over turf, sell products, conflict with rival cartels, Money vs Infamy stats
- **Secret Agent/Spy:** Mission-based gameplay
- **Street Racer:** Racing events, car upgrades

**Connection:** Every Special Career has its own "Performance/Fame/Rank meter" that increases with yearly activities, and reaching a specific threshold unlocks the next tier/promotion.

---

## 9. TAB: Assets

- **Real Estate:** Buying flats/houses — categorized by size, location, price (Apartment → House → Mansion → Private Island), Rent out, Sell
- **Vehicles:** Cars, motorcycles, boats, private jets — buy, sell, risk of accidents
- **Valuables:** Jewelry, electronics, artwork, collectible items
- **Maintenance/insurance** costs (in some versions)

**Connection:** Buying Assets directly deducts money from Wealth, but some assets (real estate) increase in value over time (acts as an investment) — connected with the Bank system.

---

## 10. Bank/Finance System

- **Savings Account** — Accrues interest
- **Loans** — Student loan, personal loan, must be repaid with interest
- **Investments** — Stock market, Cryptocurrency, Mutual funds — values fluctuate
- **Credit Cards/Debt** — Overspending leads to debt, chance of Bankruptcy
- **Lottery/Casino/Gambling** — Random win/loss
- **Inheritance** — Receiving assets when family members die
- **Will** — Deciding who gets your assets when you get older

---

## 11. Crime → Prison System (Complete standalone sub-system)

If caught:
1. **Arrest**
2. **Bail** — Can be released by paying money (if affordable)
3. **Trial/Court** — Hire lawyer (good lawyer = chance of lower sentence), Plea bargain (admit guilt for reduced sentence), Jury verdict
4. **Sentencing** — Time in prison, varies based on crime severity
5. **Prison Life:**
   - Join Gang (for protection)
   - Gym/Library (available inside prison too)
   - Fight with other inmates
   - Snitch — might reduce sentence but increases danger
   - **Escape Attempt** — Plan, pick opportunity, success/fail
   - **Parole Hearing** — Request release for good behavior after a set time
6. Post-release — Criminal record remains, affecting future jobs/immigration

---

## 12. Random Events Engine

Creates the "alive" feeling of the game:
- Health events (diagnosis, accidents, pandemics)
- Legal events (lawsuits, jury duty)
- School/Workplace events
- Family events (marriages/deaths/birthdays)
- Natural disasters (earthquakes, floods — for a Dhakaiya version, floods/load-shedding/traffic jams could be added here)
- Ghost/paranormal events (in some versions)
- Inheritance/lottery win events

Every event usually has 2-4 choice options, each choice having its own probability-based outcome.

---

## 13. Ribbons/Achievements System

- 30+ (more in some versions) ribbons/badges, such as:
  - Death at a specific age (Unlucky Ribbon)
  - Crime-related (Kingpin, Escape Artist)
  - Wealth-related (Millionaire, Billionaire)
  - Relationship-related (Many children, long marriage)
  - Fame-related (Oscar Winner, Grammy)
  - Weird/Funny (Multiple divorces, ghost encounters)
- These are cumulative — once unlocked, they remain saved in the profile

---

## 14. God Mode / Direct Control (Premium-style)

- Ability to directly increase/edit character stats (Smarts, Looks, etc.)
- Rewind/change at any life event/decision point
- Directly control the life of any family member from the family tree

---

## 15. Expansion/DLC-style Packages (Each adds a new sub-system)

These sit on top of the base game as additional layers:

- **Pets Pack** — Expands the pet system
- **Prison Pack** — Expands the prison system (gangs, riots)
- **High School/Grad School Pack** — Expands school life
- **City Folk Pack** — New urban lifestyle activities
- **Farming/Country Life Pack** — Rural lifestyle, farms
- **Soul Mates Pack** — Deepens relationship system (breakup reasons, compatibility)
- **Ambitions Pack** — Life goals/bucket-list system
- **Renovation Pack** — House decoration/renovation
- **Dealer/Cartel Pack** — Drug dealing system
- **Zoo Pack** — Zoo/animal conservation business
- **Royalty Pack** — Deepens the royalty system

**Design Note:** This "pack" concept indicates that everything in BitLife is built as a core system (Age loop + Stats + Menus) + modular add-on systems. For the Dhakaiya version, building the "core game" first and adding modular Feature-Packs later will be very effective.

---

## 16. Logical Interconnection Map

~~~text
Character Creation
        │
        ▼
   Core Stats (Happiness/Health/Smarts/Looks/Karma/Wealth)
        │
   ┌────┼─────────────┬─────────────┬─────────────┐
   ▼    ▼             ▼             ▼             ▼
Activities  Relationships   Occupation     Assets       Bank
   │            │              │             │            │
Mind&Body    Family        School──────▶ Degree      Real Estate
Crime────▶ Prison System  Friends       Job (needs    Vehicles    Investments
Love         Romance        Degree)      Valuables    Loans
Travel       Coworkers    Special Careers              Debt
Pets                       (Fame/Rank meter)
        │                        │
        └──────────┬─────────────┘
                    ▼
             Random Events Engine
                    │
                    ▼
         Ribbons/Achievements (cumulative log)
                    │
                    ▼
              Death → Legacy/Next Gen
~~~

**Core Principles (Most important when designing):**
1. Every action has a **cost** (time/money/stats) and a **reward** (stats/money/unlock).
2. Every special career has its own **progression meter** that increases yearly and unlocks the next tier at a threshold.
3. **Random Events Engine** checks the status of all systems (age, job, relationships, criminal history) and shows relevant events — meaning events are context-aware, not completely random.
4. **Age button** "ticks" all systems at once — everyone ages, all meters update, all cooldowns reset.

---

## 17. Checklist for Dhakaiya Bangla Version (Quick Reference)

- [ ] Character creation (Gender, Birthplace — Dhaka areas like Puran Dhaka/Mirpur/Dhanmondi, Family status)
- [ ] 6 Core stats (Happiness, Health, Smarts, Looks, Karma, Wealth)
- [ ] 6 Life stages & gated features
- [ ] Activities: Mind&Body, Crime, Love, Travel, Pets
- [ ] Relationships: Family, Friends, Romance, Coworkers — full action list
- [ ] Occupation: School (Nursery → School → College → University) + Job system
- [ ] Special Careers: Acting, Singing, Sports, Politics, Business, Criminal Underworld
- [ ] Assets: House/Flat, Car/Bike, Valuables
- [ ] Bank: Savings, Loans, Investments, Lottery
- [ ] Crime → Prison complete cycle
- [ ] Random Events engine (context-aware)
- [ ] Ribbons/Achievements
- [ ] God Mode/premium controls (if desired)
- [ ] Expansion-style modular pack planning

---

*Note: This document describes publicly known game mechanics and system-level descriptions — no copyrighted text/code from BitLife has been copied. When making your own game, it is best to use your own names, text, art, and local (Dhakaiya) flavor.*