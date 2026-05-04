import { StepProgress } from '@/components/wizard/StepProgress'

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-100 mb-6">Create Your Character</h1>
        <StepProgress />
      </div>
      {children}
    </div>
  )
}
