'use client'

import React from 'react'

const STEPS = [
  'Register Voters',
  'Proposals Open',
  'Proposals Closed',
  'Voting Open',
  'Voting Closed',
  'Votes Tallied'
]

interface StepperProps {
  currentStatus: number
}

export default function WorkflowStepper({ currentStatus }: StepperProps) {
  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStatus
          const isActive = index === currentStatus

          return (
            <div key={step} className="flex flex-col gap-2 relative">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border transition-all duration-300 ${
                    isActive 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none animate-pulse'
                      : isCompleted
                        ? 'bg-green-100 border-green-200 text-green-700 dark:bg-green-950/50 dark:border-green-900 dark:text-green-400'
                        : 'bg-zinc-50 border-zinc-200 text-zinc-400 dark:bg-zinc-900 dark:border-zinc-800'
                  }`}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Phase {index}
                </div>
              </div>
              <div 
                className={`text-sm font-semibold mt-1 transition-colors ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : isCompleted 
                      ? 'text-zinc-800 dark:text-zinc-200 font-medium' 
                      : 'text-zinc-400 dark:text-zinc-600'
                }`}
              >
                {step}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
