'use client';

import { useState } from 'react';

export function DevFormPresets<T>({
  title,
  presets,
  onSelect,
  onClear,
}: {
  title: string;
  presets: Array<{ label: string; description: string; data: T }>;
  onSelect: (data: T) => void;
  onClear?: () => void;
}) {
  const [selected, setSelected] = useState('');

  if (
    process.env.NODE_ENV !== 'development' ||
    process.env.NEXT_PUBLIC_SHOW_TEST_CASES === 'false'
  ) {
    return null;
  }

  return (
    <section className="dev-panel mb-6 overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Mock data library</p>
          <p className="mt-1 text-sm leading-5 text-[#536a67]">{title}</p>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={() => {
              setSelected('');
              onClear();
            }}
            className="min-h-10 border border-[#b9ccc8] bg-white px-3 text-xs font-bold hover:border-[#008ca6]"
          >
            Clear form
          </button>
        )}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {presets.map((preset, index) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setSelected(preset.label);
              onSelect(preset.data);
            }}
            className={`min-h-20 border bg-white p-3 text-left ${
              selected === preset.label
                ? 'border-[#008ca6] shadow-[inset_4px_0_0_#008ca6]'
                : 'border-[#b9ccc8] hover:border-[#008ca6]'
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-sm font-black">{preset.label}</span>
              <span className="text-[10px] font-black text-[#008ca6]">
                {String(index + 1).padStart(2, '0')}
              </span>
            </span>
            <span className="mt-2 block text-xs leading-5 text-[#657176]">
              {preset.description}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-[#657176]">
        This only fills the fields. Nothing is saved until you use the normal
        save or publish button.
      </p>
    </section>
  );
}
