import { getNotificationsAndActivity } from "@/lib/actions";
import { NotificationsHub } from "@/components/NotificationsHub";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: { member?: string };
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const memberId = searchParams?.member;
  const data = await getNotificationsAndActivity(memberId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">
          Corporate Actions, Dividends & Activity Hub
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Unified audit trail of dividends credited, stock splits, bonus shares, upcoming maturities, and portfolio risk alerts
        </p>
      </div>

      <NotificationsHub
        activity={data.activity}
        upcomingMilestones={data.upcomingMilestones as any}
        alerts={data.alerts}
      />
    </div>
  );
}
