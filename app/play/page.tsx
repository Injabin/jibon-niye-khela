import { GameHub } from '@/components/game/GameHub';

export const metadata = {
  title: 'খেলা চলতেসে — জীবন নিয়া খেলা',
  description: 'জীবন নিয়া খেলা খেলো, ঢাকাইয়া চয়েস-চালিত লাইফ সিমুলেশন।',
};

export default function PlayPage() {
  return <GameHub />;
}
