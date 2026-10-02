import type { Metadata } from "next"

import { CtaSection } from "./_components/landing/cta-section"
import { FeaturesSection } from "./_components/landing/features-section"
import { HeroSection } from "./_components/landing/hero-section"
import { LandingFooter } from "./_components/landing/landing-footer"
import { LandingHeader } from "./_components/landing/landing-header"
import { LandingMotionConfig } from "./_components/landing/motion-primitives"
import { PrivacySection } from "./_components/landing/privacy-section"
import { StepsSection } from "./_components/landing/steps-section"
import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site"

export const metadata: Metadata = {
  title: {
    absolute: SITE_TITLE,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "vi-VN",
    },
    {
      "@type": "WebApplication",
      "@id": `${SITE_URL}/#application`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "vi-VN",
    },
  ],
}

export default function HomePage() {
  return (
    <div
      data-landing-shell
      className="min-h-svh overflow-x-clip bg-[#fbfaf7] dark:bg-background"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <LandingMotionConfig>
        <LandingHeader />
        <main>
          <HeroSection />
          <FeaturesSection />
          <StepsSection />
          <PrivacySection />
          <CtaSection />
        </main>
        <LandingFooter />
      </LandingMotionConfig>
    </div>
  )
}
