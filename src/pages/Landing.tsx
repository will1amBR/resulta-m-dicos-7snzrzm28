import { LandingHero } from '@/components/landing/LandingHero'
import { LandingStats } from '@/components/landing/LandingStats'
import { LandingProblem } from '@/components/landing/LandingProblem'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingPricing } from '@/components/landing/LandingPricing'
import { LandingCTA } from '@/components/landing/LandingCTA'

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <LandingHero />
      <LandingStats />
      <LandingProblem />
      <LandingFeatures />
      <LandingPricing />
      <LandingCTA />
    </div>
  )
}
