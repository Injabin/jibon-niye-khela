import { Character } from '@/lib/engine/types';
import { getAvailableActivities, ActivityDef } from '@/lib/engine/activities';
import { getAvailableJobs } from '@/lib/engine/economy';
import { Job } from '@/lib/engine/types';

interface Props {
  character: Character;
  onPerformActivity: (activity: ActivityDef) => void;
  onTakeJob: (job: Job | null) => void;
}

export function ActivitiesPanel({ character, onPerformActivity, onTakeJob }: Props) {
  const availableActivities = getAvailableActivities(character);
  const availableJobs = getAvailableJobs(character);

  return (
    <div className="bg-white p-4 shadow-lg rounded-md border-t-4 border-indigo-500 mt-4 max-h-[300px] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Activities & Jobs</h2>
      
      {character.age >= 18 && (
        <div className="mb-6">
          <h3 className="font-bold text-gray-700 mb-2 border-b">Career</h3>
          {character.job ? (
            <div className="bg-blue-50 p-3 rounded mb-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-blue-900">{character.job.title}</p>
                <p className="text-sm text-blue-800">Salary: ${character.job.salary}/yr</p>
              </div>
              <button 
                onClick={() => onTakeJob(null)}
                className="bg-red-500 text-white px-3 py-1 text-sm rounded hover:bg-red-600"
              >
                Quit Job
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-3">You are unemployed.</p>
          )}

          <div className="space-y-2 mt-2">
            <p className="text-sm font-semibold text-gray-600">Available Jobs:</p>
            {availableJobs.length > 0 ? availableJobs.map(job => (
              <div key={job.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-gray-500">${job.salary}</p>
                </div>
                {character.job?.id !== job.id && (
                  <button 
                    onClick={() => onTakeJob(job)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700"
                  >
                    Apply
                  </button>
                )}
              </div>
            )) : (
              <p className="text-xs text-red-500">You are not smart enough for any jobs.</p>
            )}
          </div>
        </div>
      )}

      <div>
        <h3 className="font-bold text-gray-700 mb-2 border-b">Activities</h3>
        {availableActivities.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {availableActivities.map(act => (
              <button 
                key={act.id}
                onClick={() => onPerformActivity(act)}
                className="text-left bg-gray-100 hover:bg-gray-200 p-3 rounded"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-gray-900">{act.name}</span>
                  {act.cost > 0 && <span className="text-red-600 text-sm">-${act.cost}</span>}
                </div>
                <p className="text-xs text-gray-600">{act.description}</p>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No activities available.</p>
        )}
      </div>
    </div>
  );
}
