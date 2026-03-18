interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground font-body leading-relaxed lg:text-base">
              {description}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
