/**
 * Asia Electronics page header for admin sections: eyebrow, strong title,
 * muted subtitle. Matches the dashboard so every admin section reads the same.
 */
export function AdminPageHeader({ title, subtitle }) {
  return (
    <div>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
        Asia Electronics
      </p>
      <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
      ) : null}
    </div>
  );
}
