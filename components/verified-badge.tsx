export function VerifiedBadge({
  subject = 'recruiter',
}: {
  subject?: 'recruiter' | 'talent';
}) {
  return (
    <span
      title={`Verified ${subject}`}
      className="inline-flex items-center gap-1 border border-[#8fd2dc] bg-[#edf9fb] px-2 py-1 text-[10px] font-black uppercase text-[#00778d]"
    >
      <span aria-hidden="true">&#10003;</span> Verified {subject}
    </span>
  );
}
