import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex flex-col flex-1 items-center justify-center px-4 py-16 text-center">
      {/* Decorative top border */}
      <div className="w-24 h-1 bg-amber-500 rounded-full mb-8" />

      <p className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
        Dungeons &amp; Dragons 5th Edition
      </p>

      <h1 className="text-5xl sm:text-7xl font-bold text-stone-100 mb-6 leading-tight">
        Character
        <br />
        <span className="text-amber-400">Forge</span>
      </h1>

      <p className="text-stone-400 text-lg max-w-md mb-12 leading-relaxed">
        Build your hero step by step. Choose your race, class, and background —
        then bring your character to life with an AI-powered story.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/signup"
          className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg transition-colors"
        >
          Start Your Adventure
        </Link>
        <Link
          href="/login"
          className="px-8 py-3 border border-stone-600 hover:border-amber-500 hover:text-amber-400 text-stone-300 font-semibold rounded-lg transition-colors"
        >
          Sign In
        </Link>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 max-w-2xl w-full text-left">
        {[
          {
            icon: '⚔️',
            title: 'Choose Your Path',
            desc: 'Pick from all official 5e races and classes with guided explanations.',
          },
          {
            icon: '✨',
            title: 'AI Backstory Help',
            desc: 'Write your story and let AI suggest the perfect background for your character.',
          },
          {
            icon: '📜',
            title: 'Save & Resume',
            desc: 'Your progress is saved at every step. Come back anytime to finish.',
          },
        ].map(f => (
          <div key={f.title} className="bg-stone-900 border border-stone-700 rounded-xl p-5">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="text-stone-100 font-semibold mb-1">{f.title}</h3>
            <p className="text-stone-400 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="w-24 h-1 bg-amber-500 rounded-full mt-16" />
    </main>
  )
}
