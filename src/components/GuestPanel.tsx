'use client'

import React from 'react'

export default function GuestPanel() {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-100 dark:bg-zinc-900/60 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl text-center gap-3">
      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-850 flex items-center justify-center text-zinc-500">
        !
      </div>
      <div>
        <h3 className="font-semibold text-base">Not Registered as a Voter</h3>
        <p className="text-sm text-zinc-500 max-w-sm mt-1">You can view the stepper progress and tallied results. To register proposals or vote, request the contract owner to add your address.</p>
      </div>
    </div>
  )
}
