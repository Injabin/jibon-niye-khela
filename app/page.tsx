'use client';
import { useEffect, useState } from 'react';
import { useGameStore, initializeSave, exportSaveString, importSaveString } from '@/lib/store/gameStore';
import { StatBar } from '@/components/game/StatBar';
import { EventCard } from '@/components/game/EventCard';
import { ActivitiesPanel } from '@/components/game/ActivitiesPanel';

import { playSound } from '@/lib/audio';
import { AnimatePresence, motion } from 'framer-motion';
import { ActivityDef } from '@/lib/engine/activities';
import { Job } from '@/lib/engine/types';

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
    playSound('click');
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
    playSound('click');
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

  const handleAgeUp = () => {
    playSound('ageUp');
    ageUp();
    if (useGameStore.getState().character?.alive === false) {
      playSound('death');
    }
  };

  const handleStartGame = () => {
    playSound('click');
    startGame();
  };

  const handleActivity = (act: ActivityDef) => {
    playSound('click');
    performActivity(act);
  };

  const handleJob = (job: Job | null) => {
    playSound('click');
    takeJob(job);
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-8 font-sans">
      <div className="max-w-md mx-auto space-y-4">
        
        {/* Top Panel */}
        <div className="bg-white p-4 shadow-sm rounded-xl flex justify-between items-center border border-gray-100">
           <div>
              <h1 className="text-2xl font-bold text-gray-800 tracking-tight">{character.name} {character.surname}</h1>
              <p className="text-sm font-medium text-gray-500">Age: {character.age} <span className="mx-2">|</span> <span className="text-primary">${character.money.toLocaleString()}</span></p>
           </div>
           <div className="flex flex-col gap-2">
              <button onClick={handleExport} className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 font-semibold text-gray-600 transition-colors shadow-sm active:scale-95">Export</button>
              <label className="text-xs bg-gray-100 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-gray-200 font-semibold text-gray-600 text-center transition-colors shadow-sm active:scale-95">
                Import
                <input type="file" className="hidden" accept=".json" onChange={handleImport} />
              </label>
           </div>
        </div>

        {/* Stat Bars */}
        <div className="bg-white p-5 shadow-sm rounded-xl space-y-4 border border-gray-100">
           <StatBar label="Health" value={character.stats.health} color="bg-primary" />
           <StatBar label="Happiness" value={character.stats.happiness} color="bg-warning" />
           <StatBar label="Smarts" value={character.stats.smarts} color="bg-secondary" />
           <StatBar label="Looks" value={character.stats.looks} color="bg-danger" />
        </div>

        {/* Event/Action Area */}
        <div className="min-h-[220px] flex flex-col justify-center relative">
          <AnimatePresence mode="wait">
            {pendingEvents.length > 0 ? (
              <EventCard key="event" event={pendingEvents[0]} onResolve={(choiceId) => resolveEvent(pendingEvents[0].id, choiceId)} />
            ) : character.alive ? (
              <motion.div key="alive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="flex justify-center mb-4">
                   <button 
                     onClick={handleAgeUp} 
                     className="bg-primary text-white px-12 py-5 rounded-full text-2xl font-black shadow-lg shadow-primary/30 active:scale-95 hover:bg-emerald-400 transition-all"
                   >
                     Age Up +
                   </button>
                </div>
                <ActivitiesPanel character={character} onPerformActivity={handleActivity} onTakeJob={handleJob} />
              </motion.div>
            ) : (
              <motion.div key="dead" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-900 text-white p-8 shadow-2xl rounded-2xl text-center">
                 <h2 className="text-3xl font-black mb-2 text-danger">RIP</h2>
                 <h3 className="text-xl font-bold mb-4">{character.name} {character.surname}</h3>
                 <p className="mb-6 text-gray-300">Died at age {character.age} from {character.causeOfDeath}.</p>
                 <button onClick={handleStartGame} className="bg-white text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-200 active:scale-95 transition-all shadow-lg">
                   Start Fresh
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* History Log */}
        <div className="bg-white p-5 shadow-sm rounded-xl h-72 flex flex-col border border-gray-100">
           <h3 className="font-bold text-gray-800 mb-3 border-b pb-2 tracking-tight">Life Log</h3>
           <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
             <AnimatePresence initial={false}>
               {character.history.slice().reverse().map((entry, idx) => (
                 <motion.div 
                   key={`${character.age}-${character.history.length - idx}`} 
                   initial={{ opacity: 0, x: -20, height: 0 }}
                   animate={{ opacity: 1, x: 0, height: 'auto' }}
                   className={`text-sm pb-1 leading-relaxed ${entry.tone === 'bad' ? 'text-danger' : entry.tone === 'good' ? 'text-primary' : entry.tone === 'funny' ? 'text-secondary' : 'text-gray-600'}`}
                 >
                   <span className="font-bold text-gray-900">Age {entry.age}:</span> {entry.text}
                 </motion.div>
               ))}
             </AnimatePresence>
           </div>
        </div>
        
      </div>
    </main>
  );
}
