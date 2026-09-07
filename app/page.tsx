import { GameHub } from '@/components/game/GameHub';

export default function Home() {
  return (
    <main className="flex flex-1 flex-col px-6">
      <header className="mx-auto w-full max-w-xl pt-8 text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-primary">
          Jibon Niye Khela
        </p>
        <p className="mt-1 text-sm text-text-muted">Play one whole life, one year at a time.</p>
      </header>
      <GameHub />
    </main>
  );
}