interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export default function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-8 lg:mb-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-2 text-sm lg:text-base text-muted-foreground font-body leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>
    </div>
  );
}
