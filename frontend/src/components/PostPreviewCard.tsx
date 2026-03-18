import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import VisibilityBadge from "@/components/VisibilityBadge";
import type { Post } from "@/types/posts";

export default function PostPreviewCard({
  post,
  to,
  showAuthor = false,
}: {
  post: Post;
  to: string;
  showAuthor?: boolean;
}) {
  const date = new Date(post.skapad_datum).toLocaleDateString("sv-SE");
  const excerpt = post.innehall.slice(0, 160) + (post.innehall.length > 160 ? "..." : "");

  return (
    <Link to={to}>
      <ContentCard className="group cursor-pointer border-transparent bg-card/70 hover:border-primary/20 hover:bg-card transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-body font-medium text-primary capitalize">{post.kategori.namn}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground font-body">{date}</span>
              <VisibilityBadge value={post.synlighet} />
            </div>
            <h3 className="text-base lg:text-lg font-display font-medium text-foreground mb-2">{post.titel}</h3>
            {showAuthor && (
              <p className="mb-2 text-xs text-muted-foreground font-body">Av {post.anvandar.anvandarnamn}</p>
            )}
            <p className="text-sm text-muted-foreground font-body leading-relaxed line-clamp-3">{excerpt}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground/70 shrink-0 mt-1 group-hover:text-primary transition-colors" />
        </div>
      </ContentCard>
    </Link>
  );
}
