import { LifeEventDef } from '@/lib/engine/types';
import { motion } from 'framer-motion';
import { playSound } from '@/lib/audio';

export function EventCard({ event, onResolve }: { event: LifeEventDef, onResolve: (choiceId: string) => void }) {
  const handleResolve = (id: string) => {
    playSound('click');
    onResolve(id);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="bg-white p-6 shadow-xl rounded-md border-t-4 border-primary z-10 relative"
    >
       <p className="text-lg mb-6 font-medium">{event.text}</p>
       <div className="space-y-3">
         {event.choices.map((choice) => (
           <button 
             key={choice.id} 
             onClick={() => handleResolve(choice.id)}
             className="w-full text-left p-3 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors font-medium shadow-sm active:scale-[0.98]"
           >
             {choice.text}
           </button>
         ))}
       </div>
    </motion.div>
  );
}
