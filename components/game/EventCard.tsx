import { LifeEventDef } from '@/lib/engine/types';

export function EventCard({ event, onResolve }: { event: LifeEventDef, onResolve: (choiceId: string) => void }) {
  return (
    <div className="bg-white p-6 shadow-lg rounded-md border-t-4 border-blue-500">
       <p className="text-lg mb-6">{event.text}</p>
       <div className="space-y-3">
         {event.choices.map((choice) => (
           <button 
             key={choice.id} 
             onClick={() => onResolve(choice.id)}
             className="w-full text-left p-3 rounded bg-gray-100 hover:bg-gray-200 font-medium"
           >
             {choice.text}
           </button>
         ))}
       </div>
    </div>
  );
}
