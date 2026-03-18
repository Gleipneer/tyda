import AppLayout from "@/components/AppLayout";
import PageHeader from "@/components/PageHeader";
import ContentCard from "@/components/ContentCard";
import ConceptBadge from "@/components/ConceptBadge";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const posts = [
  { id: 1, title: "Drömmen om templet vid havet", category: "Dröm", date: "14 mars 2026", excerpt: "Jag stod vid ett tempel som reste sig ur havet. Vattnet var stilla men djupt...", concepts: ["tempel", "hav", "vatten"] },
  { id: 2, title: "Reflektion: elden och askan", category: "Reflektion", date: "12 mars 2026", excerpt: "Elden brinner ner men askan bär minnet av det som var. Soten svärtade mina händer...", concepts: ["eld", "aska", "sot"] },
  { id: 3, title: "Vision om bron över floden", category: "Vision", date: "10 mars 2026", excerpt: "En bro sträckte sig från den ena stranden till den andra, halvt upplyst av morgonljuset...", concepts: ["bro", "flod", "vatten", "ljus"] },
  { id: 4, title: "Ormen i trädgården", category: "Dröm", date: "8 mars 2026", excerpt: "Den låg hoprullad under stenen, glittrande och stilla. Jag kände ingen rädsla...", concepts: ["orm", "jord"] },
  { id: 5, title: "Tankar om mörker och ljus", category: "Tanke", date: "5 mars 2026", excerpt: "Mörkret är inte frånvaron av ljus, utan ett eget tillstånd. Det omsluter...", concepts: ["mörker", "ljus", "natt"] },
];

export default function PostsPage() {
  return (
    <AppLayout>
      <PageHeader
        title="Poster"
        description="Alla reflektioner, drömmar och visioner."
      >
        <Link
          to="/new-post"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-body font-medium hover:bg-primary/90 transition-colors"
        >
          Ny post
        </Link>
      </PageHeader>

      <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post.id} to={`/posts/${post.id}`}>
            <ContentCard className="hover:border-primary/30 transition-colors cursor-pointer group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-body font-medium text-primary">{post.category}</span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground font-body">{post.date}</span>
                  </div>
                  <h3 className="text-base lg:text-lg font-display font-medium text-foreground mb-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-2">{post.excerpt}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {post.concepts.map((c) => (
                      <ConceptBadge key={c} label={c} />
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1 group-hover:text-primary transition-colors" />
              </div>
            </ContentCard>
          </Link>
        ))}
      </div>
    </AppLayout>
  );
}
