import { motion } from 'framer-motion';

export function StatBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 text-sm font-medium">{label}</div>
      <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
         <motion.div 
           className={`${color} h-3 rounded-full`} 
           initial={{ width: 0 }}
           animate={{ width: `${value}%` }} 
           transition={{ type: 'spring', stiffness: 80, damping: 15 }}
         />
      </div>
      <div className="w-8 text-right text-xs">{value}</div>
    </div>
  );
}
