'use client'

import { useTransition, useState } from 'react'
import { deleteCharacter } from '@/app/actions/character'

export function DeleteCharacterButton({ id, name }: { id: string; name: string }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteCharacter(id)
      setShowConfirm(false)
    })
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-2 rounded-lg text-sm text-stone-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        Delete
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-stone-900 border border-stone-700 rounded-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <h2 className="text-stone-100 font-semibold text-lg">Delete character?</h2>
            <p className="text-stone-400 text-sm">
              <span className="text-stone-200 capitalize">{name}</span> will be permanently deleted.
              This cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-stone-700 hover:bg-stone-600 text-stone-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
              >
                {isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
