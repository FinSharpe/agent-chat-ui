/**
 * Declarative schema for the manual investment forms (Fixed Deposits, Real
 * Estate, Commodities, Insurance, Other Investments). One <SchemaForm> renders
 * any of these from a schema, owning state, validation, a11y wiring, and the
 * footer — so each form collapses to a field list instead of ~500-1300 lines of
 * copy-pasted JSX.
 */

export type FormValues = Record<string, string | boolean>;

export type SelectOption = { value: string; label: string };

export type FieldType =
  | "text"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

export type FieldDef = {
  /** Key in the form values object. */
  name: string;
  /** Visible label (a `*` is appended automatically when `required`). */
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Options for `select`. */
  options?: SelectOption[];
  /** Rows for `textarea`. */
  rows?: number;
  /** `step` for `number`. */
  step?: string;
  /** Column span within a grid row (default 1). */
  colSpan?: number;
};

/** A single field, or an array of fields laid out as a grid row. */
export type Row = FieldDef | FieldDef[];

export type Section = {
  /** Optional heading shown above the section. */
  title?: string;
  /** Card background tone; omit for no card wrapper. */
  tone?: "blue" | "orange";
  /** Render the section only when the predicate passes. */
  visibleWhen?: (values: FormValues) => boolean;
  rows: Row[];
};

export type FormSchema = {
  sections: Section[];
  initialValues: FormValues;
  /** Cross-field validation; return an error message to block submit, or null. */
  validate?: (values: FormValues) => string | null;
  /** Submit button label (depends on whether we're editing). */
  submitLabel: (isEdit: boolean) => string;
  /** Tailwind classes for the submit button (per-asset accent colour). */
  submitClassName: string;
};

export const isFieldArray = (row: Row): row is FieldDef[] => Array.isArray(row);
