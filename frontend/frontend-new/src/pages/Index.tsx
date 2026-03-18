import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const recentPosts = [
  { id: 1, title: "Drömmen om templet vid havet", category: "Dröm", date: "14 mars 2026", concepts: ["tempel", "hav", "vatten"] },
  { id: 2, title: "Reflektion: elden och askan", category: "Reflektion", date: "12 mars 2026", concepts: ["eld", "aska"] },
  { id: 3, title: "Vision om bron över floden", category: "Vision", date: "10 mars 2026", concepts: ["bro", "flod", "vatten"] },
];

export default function Index() {
  return (
    <AppLayout>
      <PageHeader
        title="Dashboard"
        description="Överblick över ditt reflektionsarkiv."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8 lg:mb-10">
        <StatCard label="Poster" value={42} sublabel="+3 denna vecka" />
        <StatCard label="Begrepp" value={39} sublabel="i lexikonet" />
        <StatCard label="Kopplingar" value={87} sublabel="post–begrepp" />
        <StatCard label="Aktivitet" value={12} sublabel="senaste 7 dagar" />
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-display font-semibold text-foreground">Senaste poster</h2>
          <Link to="/posts" className="text-sm text-primary hover:text-primary/80 font-body font-medium flex items-center gap-1 transition-colors">
            Visa alla <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {recentPosts.map((post) => (
            <Link key={post.id} to={`/posts/${post.id}`}>
              <ContentCard className="hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-body font-medium text-primary">{post.category}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground font-body">{post.date}</span>
                    </div>
                    <h3 className="text-base font-display font-medium text-foreground">{post.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {post.concepts.map((c) => (
                        <ConceptBadge key={c} label={c} />
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                </div>
              </ContentCard>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
