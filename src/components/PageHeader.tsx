export default function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-5">
      <h1 className="text-[22px] font-bold leading-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-[13px] text-muted">{subtitle}</p>
      ) : null}
    </header>
  );
}
