'use client';
import { useEffect, useState } from 'react';
import { useGameStore, initializeSave, exportSaveString, importSaveString } from '@/lib/store/gameStore';
import { StatBar } from '@/components/game/StatBar';
import { EventCard } from '@/components/game/EventCard';
import { ActivitiesPanel } from '@/components/game/ActivitiesPanel';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const character = useGameStore(s => s.character);
  const pendingEvents = useGameStore(s => s.pendingEvents);
  const startGame = useGameStore(s => s.startGame);
  const ageUp = useGameStore(s => s.ageUp);
  const resolveEvent = useGameStore(s => s.resolveEvent);
  const performActivity = useGameStore(s => s.performActivity);
  const takeJob = useGameStore(s => s.takeJob);

  useEffect(() => {
    const hasSave = initializeSave();
    if (!hasSave) {
      startGame();
    }
    // eslint-disable-next-line
    setIsLoaded(true);
  }, [startGame]);

  if (!isLoaded || !character) return <div className="p-4">Loading...</div>;

  const handleExport = () => {
    const save = exportSaveString();
    if (save) {
      const blob = new Blob([save], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `save_${character.name}_${character.age}.json`;
      a.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === 'string') {
          importSaveString(e.target.result);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900 p-4 sm:p-8">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Top Panel */}
        <div className="bg-white p-4 shadow rounded-md flex justify-between items-center">
           <div>
              <h1 className="text-xl font-bold">{character.name} {character.surname}</h1>
              <p className="text-sm text-gray-600">Age: {character.age} | Money: ${character.money}</p>
           </div>
           <div className="flex flex-col gap-2">
              <button onClick={handleExport} className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 font-medium">Export Save</button>
              <label className="text-xs bg-gray-200 px-3 py-1 rounded cursor-pointer hover:bg-gray-300 font-medium text-center">
                Import Save
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
           </div>
        </div>

        {/* Stat Bars */}
        <div className="bg-white p-4 shadow rounded-md space-y-3">
           <StatBar label="Health" value={character.stats.health} color="bg-green-500" />
           <StatBar label="Happiness" value={character.stats.happiness} color="bg-yellow-400" />
           <StatBar label="Smarts" value={character.stats.smarts} color="bg-blue-500" />
           <StatBar label="Looks" value={character.stats.looks} color="bg-pink-500" />
        </div>

        {/* Event/Action Area */}
        <div className="min-h-[200px] flex flex-col justify-center">
          {pendingEvents.length > 0 ? (
            <EventCard event={pendingEvents[0]} onResolve={(choiceId) => resolveEvent(pendingEvents[0].id, choiceId)} />
          ) : character.alive ? (
            <div>
              <div className="flex justify-center mb-4">
                 <button onClick={ageUp} className="bg-blue-600 text-white px-10 py-4 rounded-full text-xl font-bold shadow-lg active:bg-blue-700 hover:bg-blue-500 transition-colors">
                   Age Up +
                 </button>
              </div>
              <ActivitiesPanel character={character} onPerformActivity={performActivity} onTakeJob={takeJob} />
            </div>
          ) : (
            <div className="bg-white p-6 shadow rounded-md text-center">
               <h2 className="text-2xl font-bold mb-2">RIP {character.name}</h2>
               <p className="mb-4 text-gray-700">Died at age {character.age} from {character.causeOfDeath}.</p>
               <button onClick={startGame} className="bg-gray-800 text-white px-6 py-2 rounded font-medium hover:bg-gray-700">
                 Start Fresh
               </button>
            </div>
          )}
        </div>

        {/* History Log */}
        <div className="bg-white p-4 shadow rounded-md h-64 flex flex-col">
           <h3 className="font-bold mb-3 border-b pb-2">Life Log</h3>
           <div className="overflow-y-auto flex-1 space-y-1 pr-2">
             {character.history.slice().reverse().map((entry, idx) => (
               <div key={idx} className={`text-sm pb-1 ${entry.tone === 'bad' ? 'text-red-600' : entry.tone === 'good' ? 'text-green-600' : entry.tone === 'funny' ? 'text-purple-600' : 'text-gray-700'}`}>
                 <span className="font-semibold text-gray-900">Age {entry.age}:</span> {entry.text}
               </div>
             ))}
           </div>
        </div>
        
      </div>
    </main>
  );
}
