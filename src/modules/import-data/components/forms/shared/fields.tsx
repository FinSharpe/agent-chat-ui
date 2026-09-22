"use client";
import type { ComponentType, ReactNode } from "react";
import {
  CalendarClock,
  DollarSign,
  FileText,
  Home,
  Info,
  Landmark,
  LineChart,
  Package,
  ShieldCheck,
  Smartphone,
  Target,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FieldDef,
  FormValues,
  Row,
  Section,
  SectionTone,
  isFieldArray,
} from "./form-schema";

/**
 * Field, row and section renderers for SchemaForm, in the reference
 * "Add [Asset]" form style (formFields.tsx): soft blue-tinted inputs, small
 * navy labels with a rose required star, native selects and checkboxes, and
 * tinted section groups with an icon + title.
 */

export const inputClass =
  "w-full px-3.5 py-2.5 rounded-nested bg-[#EDF3FF]/45 dark:bg-slate-800/40 text-[12px] text-forest-deep dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#063BAA]/20 disabled:opacity-50";

type SetField = (name: string, value: string | boolean) => void;

function FieldLabel({
  htmlFor,
  label,
  required,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-forest-deep mb-1.5 block text-[10.5px] font-medium dark:text-white"
    >
      {label}
      {required && <span className="text-rose-500"> *</span>}
    </label>
  );
}

// Money fields get the reference's ₹ prefix inside the input. Most schemas
// mark them with a "₹ …" placeholder (moved into the prefix); for the rest,
// read it off the label — amounts, prices and values, never rates or counts.
const MONEY =
  /(amount|price|value|premium|sum assured|cost|charges|duty|maintenance|\brent\b|emi\b|fees?\b|income|invest)/i;
const NOT_MONEY =
  /(%|rate|ratio|percent|year|month|day|age|area|units|quantity|number|share|tenure|weight|purity|count)/i;
function moneyField(field: FieldDef): {
  prefix?: string;
  placeholder?: string;
} {
  const ph = field.placeholder;
  if (ph?.startsWith("₹")) {
    return { prefix: "₹", placeholder: ph.replace(/^₹\s*/, "") };
  }
  const isMoney =
    field.type === "number" &&
    MONEY.test(field.label) &&
    !NOT_MONEY.test(field.label);
  return { prefix: isMoney ? "₹" : undefined, placeholder: ph };
}

export function FieldView({
  field,
  values,
  setField,
}: {
  field: FieldDef;
  values: FormValues;
  setField: SetField;
}) {
  const { name, label, type, required, placeholder } = field;

  if (type === "checkbox") {
    return (
      <label className="flex cursor-pointer items-center gap-2.5 py-1 select-none">
        <input
          id={name}
          type="checkbox"
          checked={Boolean(values[name])}
          onChange={(e) => setField(name, e.target.checked)}
          className="h-4 w-4 shrink-0 rounded accent-[#063BAA]"
        />
        <span className="text-forest-deep text-[11.5px] dark:text-white">
          {label}
        </span>
      </label>
    );
  }

  const value =
    typeof values[name] === "string" ? (values[name] as string) : "";
  const { prefix, placeholder: inputPlaceholder } = moneyField(field);

  return (
    <div className="min-w-0">
      <FieldLabel
        htmlFor={name}
        label={label}
        required={required}
      />
      {type === "select" ? (
        <select
          id={name}
          aria-required={required}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
          className={cn(
            inputClass,
            "appearance-none",
            !value && "text-slate-400",
          )}
        >
          <option
            value=""
            disabled
          >
            {placeholder ?? "Select"}
          </option>
          {field.options?.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
            >
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          id={name}
          placeholder={placeholder}
          rows={field.rows ?? 2}
          aria-required={required}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
          className={cn(inputClass, "resize-none")}
        />
      ) : (
        <div className="relative">
          {prefix && (
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-[12px] text-slate-400">
              {prefix}
            </span>
          )}
          <input
            id={name}
            type={type}
            step={type === "number" ? field.step : undefined}
            placeholder={inputPlaceholder}
            aria-required={required}
            value={value}
            onChange={(e) => setField(name, e.target.value)}
            className={cn(inputClass, prefix && "pl-7")}
          />
        </div>
      )}
    </div>
  );
}

export function RowView({
  row,
  values,
  setField,
}: {
  row: Row;
  values: FormValues;
  setField: SetField;
}) {
  if (!isFieldArray(row)) {
    return (
      <FieldView
        field={row}
        values={values}
        setField={setField}
      />
    );
  }
  const cols = row.reduce((sum, f) => sum + (f.colSpan ?? 1), 0);
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {row.map((field) => (
        <div
          key={field.name}
          className="min-w-0"
          style={
            field.colSpan ? { gridColumn: `span ${field.colSpan}` } : undefined
          }
        >
          <FieldView
            field={field}
            values={values}
            setField={setField}
          />
        </div>
      ))}
    </div>
  );
}

// The reference uses three tints (mint, blue, amber); the schemas' extra
// tones get quiet neighbours in the same family.
const TONES: Record<SectionTone, { box: string; title: string }> = {
  green: {
    box: "bg-[#97edcc]/12 border-[#97edcc]/40",
    title: "text-[#0A9E6E]",
  },
  blue: {
    box: "bg-[#063BAA]/5 border-[#063BAA]/15",
    title: "text-[#063BAA] dark:text-[#8FB4FF]",
  },
  amber: {
    box: "bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20",
    title: "text-amber-700 dark:text-amber-400",
  },
  yellow: {
    box: "bg-amber-50 border-amber-200 dark:bg-amber-500/5 dark:border-amber-500/20",
    title: "text-amber-700 dark:text-amber-400",
  },
  orange: {
    box: "bg-orange-50/70 border-orange-200/70 dark:bg-orange-500/5 dark:border-orange-500/20",
    title: "text-orange-700 dark:text-orange-400",
  },
  purple: {
    box: "bg-purple-50/60 border-purple-200/60 dark:bg-purple-500/5 dark:border-purple-500/20",
    title: "text-purple-600 dark:text-purple-400",
  },
  gray: {
    box: "bg-slate-50 border-slate-100 dark:bg-slate-800/30 dark:border-slate-800",
    title: "text-slate-500",
  },
  red: {
    box: "bg-rose-50/70 border-rose-200/70 dark:bg-rose-500/5 dark:border-rose-500/20",
    title: "text-rose-600 dark:text-rose-400",
  },
};

type IconType = ComponentType<{ size?: number; className?: string }>;

// Every reference section group leads with an icon; pick one from the title.
const SECTION_ICONS: [RegExp, IconType][] = [
  [/maturity|renewal|tenure|alert|monitor/i, CalendarClock],
  [/nominee|agent|advisor|holder/i, UserRound],
  [/loan|financ|payout|payment/i, Landmark],
  [/insurance|claim|policy|compliance/i, ShieldCheck],
  [/storage|physical|quality|specification/i, Package],
  [/rental|property|home/i, Home],
  [/digital|etf|online/i, Smartphone],
  [/trading|exchange|equity|fixed income|futures/i, LineChart],
  [/strategy|categor/i, Target],
  [/document/i, FileText],
  [/investment|purchase|valuation|cost|charges/i, DollarSign],
];

function sectionIcon(title: string): ReactNode {
  if (/tax/i.test(title))
    return <span className="text-[13px] leading-none">₹</span>;
  const Icon = SECTION_ICONS.find(([re]) => re.test(title))?.[1] ?? Info;
  return <Icon size={13} />;
}

export function SectionView({
  section,
  values,
  setField,
}: {
  section: Section;
  values: FormValues;
  setField: SetField;
}) {
  // Consecutive checkbox rows stay together as one tight list (the reference
  // groups its toggles), instead of taking the full field spacing each.
  const isToggleRow = (row: Row) =>
    (isFieldArray(row) ? row : [row]).every((f) => f.type === "checkbox");
  const groups: Row[][] = [];
  section.rows.forEach((row) => {
    const last = groups[groups.length - 1];
    if (last && isToggleRow(row) && isToggleRow(last[0])) last.push(row);
    else groups.push([row]);
  });
  const renderRow = (row: Row, i: number) => (
    <RowView
      key={i}
      row={row}
      values={values}
      setField={setField}
    />
  );
  const rows = groups.map((group, g) =>
    group.length > 1 ? (
      <div
        key={`g${g}`}
        className="space-y-1"
      >
        {group.map(renderRow)}
      </div>
    ) : (
      renderRow(group[0], g)
    ),
  );

  if (section.tone) {
    const tone = TONES[section.tone];
    return (
      <div className={cn("rounded-card space-y-3.5 border p-4", tone.box)}>
        {section.title && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-[11px] font-medium",
              tone.title,
            )}
          >
            {sectionIcon(section.title)}
            <span>{section.title}</span>
          </div>
        )}
        {rows}
      </div>
    );
  }

  // Untitled plain sections put their rows straight into the form column
  // (like the reference's top-level fields), taking its spacing.
  if (!section.title) return <>{rows}</>;

  return (
    <div>
      <p className="text-forest-deep mb-1.5 text-[10.5px] font-medium dark:text-white">
        {section.title}
      </p>
      <div className="space-y-3">{rows}</div>
    </div>
  );
}
