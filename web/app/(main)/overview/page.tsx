import { Page } from "@/components/page"

import { Missions } from "./_components/missions"
import { OverviewHeader } from "./_components/overview-header"
import { OverviewScreen } from "./_components/overview-screen"
import { PlanInviteProvider } from "./_components/plan-invite"
import { greetingFor } from "./_lib/greeting"
import { loadOverview } from "./_lib/load-overview"

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string; order?: string }>
}) {
  const { screen, order } = await searchParams
  const data = await loadOverview(order)

  return (
    <Page>
      <OverviewHeader user={data.user} planState={data.planState} greeting={greetingFor(new Date())} />
      <PlanInviteProvider
        planState={data.planState}
        checkoutEnabled={data.checkoutEnabled}
        paymentOutcome={data.paymentOutcome}
        // Back from payOS: the plans open again.
        initialOpen={screen === "plan"}
      >
        <OverviewScreen
          accounts={data.accounts}
          categoryGroups={data.categoryGroups}
          days={data.days}
          allocation={data.allocation}
          today={data.today}
          minMonth={data.minMonth}
          summary={data.summary}
          missions={
            <Missions
              state={data.missions}
              accounts={data.accounts}
              contacts={data.contacts}
              categoryGroups={data.categoryGroups}
          />
        }
        />
      </PlanInviteProvider>
    </Page>
  )
}
