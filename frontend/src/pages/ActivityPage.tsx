import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import { Activity } from "lucide-react";
import { useActiveUser } from "@/contexts/ActiveUserContext";
import { fetchActivity } from "@/services/activity";
import { fetchPosts } from "@/services/posts";

export default function ActivityPage() {
  const { activeUser } = useActiveUser();
  const { data: activity = [], isLoading, error } = useQuery({
    queryKey: ["activity"],
    queryFn: fetchActivity,
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["my-posts-activity", activeUser?.anvandar_id],
    queryFn: () => fetchPosts({ anvandarId: activeUser!.anvandar_id }),
    enabled: !!activeUser,
  });

  const postTitles = useMemo(
    () => new Map(posts.map((post) => [post.post_id, post.titel])),
    [posts]
  );
  const groupedActivity = useMemo(() => {
    const grouped = new Map<string, typeof activity>();
    activity.forEach((entry) => {
      const day = new Date(entry.tidpunkt).toLocaleDateString("sv-SE", { dateStyle: "long" });
      grouped.set(day, [...(grouped.get(day) ?? []), entry]);
    });
    return Array.from(grouped.entries());
  }, [activity]);

  return (
    <AppLayout>
      <PageHeader
        title="Aktivitet"
        description="Här ser du vad som har hänt i ditt rum över tid, i den ordning det blev sparat."
      />

      <ContentCard>
        {isLoading ? (
          <p className="text-sm text-muted-foreground font-body">Laddar aktivitet...</p>
        ) : error ? (
          <p className="text-sm text-muted-foreground font-body">Kunde inte hämta aktivitetsloggen.</p>
        ) : activity.length === 0 ? (
          <p className="text-sm text-muted-foreground font-body">Ingen aktivitet finns loggad ännu.</p>
        ) : (
          <div className="space-y-6">
            {groupedActivity.map(([day, entries]) => (
              <div key={day}>
                <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground font-body">{day}</p>
                <div className="space-y-0 divide-y divide-border">
                  {entries.map((a) => (
                    <div key={a.logg_id} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="mt-0.5 p-1.5 bg-accent rounded-xl">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body text-foreground">
                          <span className="font-medium">{a.handelse}</span>
                          <span className="text-muted-foreground"> · </span>
                          <Link to={`/posts/${a.post_id}`} className="italic text-primary hover:underline">
                            {postTitles.get(a.post_id) ?? "Öppna posten"}
                          </Link>
                        </p>
                        <p className="text-xs text-muted-foreground font-body mt-0.5">
                          {new Date(a.tidpunkt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>
    </AppLayout>
  );
}
