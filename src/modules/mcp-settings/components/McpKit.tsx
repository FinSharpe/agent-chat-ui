import React from "react";

/* Small pieces shared by the MCP Access sections, in the reference's
   language: a bare section heading above a glass card, hairline rows. */

/** Reference form-field surface (import forms): soft blue fill, no border. */
export const inputClass =
  "w-full px-3.5 py-2.5 rounded-nested bg-[#EDF3FF]/45 dark:bg-slate-800/40 text-[12px] text-[#0A1F4D] dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#063BAA]/20 disabled:opacity-50";

export function SectionHeading({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <div className="space-y-0.5 px-1">
      <h3 className="font-geist text-sm font-medium text-[#0A1F4D]">{title}</h3>
      {sub && (
        <p className="text-[11px] leading-relaxed text-slate-400">{sub}</p>
      )}
    </div>
  );
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[10.5px] font-medium text-[#0A1F4D]"
    >
      {children}
    </label>
  );
}

/** Placeholder rows while a list loads. */
export function RowSkeletons({ count }: { count: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="rounded-nested h-12 animate-pulse bg-slate-100"
        />
      ))}
    </div>
  );
}

/** Centred icon + two lines, for a list with nothing in it yet. */
export function EmptyRows({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <div className="tone-blue flex h-10 w-10 items-center justify-center rounded-full">
        {icon}
      </div>
      <p className="text-xs font-medium text-[#0A1F4D]">{title}</p>
      <p className="text-[10.5px] text-slate-400">{sub}</p>
    </div>
  );
}
