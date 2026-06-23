export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12">
      <div
        className="flex items-center gap-3 border border-[#cbd8dd] bg-white p-5 text-sm font-bold text-[#657176]"
        role="status"
      >
        <span className="size-2.5 shrink-0 rounded-full bg-[#00c2e0] shadow-[0_0_0_6px_rgba(0,194,224,0.12)]" />
        <span>Loading...</span>
      </div>
    </div>
  );
}
