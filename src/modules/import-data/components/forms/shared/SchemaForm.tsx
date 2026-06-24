"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import {
  FieldDef,
  FormSchema,
  FormValues,
  Row,
  Section,
  SectionTone,
  isFieldArray,
} from "./form-schema";

type SchemaFormProps = {
  schema: FormSchema;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: FormValues;
};

// Tailwind needs literal class names, so each tone is enumerated.
const TONE_CARD: Record<SectionTone, string> = {
  blue: "bg-blue-50 border-blue-200",
  orange: "bg-orange-50 border-orange-200",
  green: "bg-green-50 border-green-200",
  yellow: "bg-yellow-50 border-yellow-200",
  purple: "bg-purple-50 border-purple-200",
  gray: "bg-gray-50 border-gray-200",
  red: "bg-red-50 border-red-200",
  amber: "bg-amber-50 border-amber-200",
};
const TONE_TITLE: Record<SectionTone, string> = {
  blue: "text-blue-900",
  orange: "text-orange-900",
  green: "text-green-900",
  yellow: "text-yellow-900",
  purple: "text-purple-900",
  gray: "text-gray-900",
  red: "text-red-900",
  amber: "text-amber-900",
};

/**
 * Renders a manual investment form from a schema. Owns form state, required +
 * cross-field validation, accessible label wiring, and the footer.
 */
export function SchemaForm({
  schema,
  onSubmit,
  onCancel,
  initialData,
}: SchemaFormProps) {
  const [values, setValues] = useState<FormValues>(
    initialData ?? schema.initialValues,
  );

  const setField = (name: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const visibleSections = schema.sections.filter(
    (s) => !s.visibleWhen || s.visibleWhen(values),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Required-field validation (visible fields only), focusing the first gap.
    for (const section of visibleSections) {
      for (const field of section.rows.flatMap((r) => (isFieldArray(r) ? r : [r]))) {
        if (field.required && field.type !== "checkbox") {
          const value = values[field.name];
          if (typeof value !== "string" || value.trim() === "") {
            toast.error(`Please fill in ${field.label}`);
            document.getElementById(field.name)?.focus();
            return;
          }
        }
      }
    }

    const crossFieldError = schema.validate?.(values);
    if (crossFieldError) {
      toast.error(crossFieldError);
      return;
    }

    onSubmit(values);
    setValues(schema.initialValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {visibleSections.map((section, i) => (
        <SectionView key={section.title ?? i} section={section} values={values} setField={setField} />
      ))}

      <div className="flex gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className={`flex-1 ${schema.submitClassName}`}>
          {schema.submitLabel(Boolean(initialData))}
        </Button>
      </div>
    </form>
  );
}

function SectionView({
  section,
  values,
  setField,
}: {
  section: Section;
  values: FormValues;
  setField: (name: string, value: string | boolean) => void;
}) {
  const rows = section.rows.map((row, i) => (
    <RowView key={i} row={row} values={values} setField={setField} />
  ));

  if (section.tone) {
    return (
      <div className={`space-y-3 rounded-lg border p-4 ${TONE_CARD[section.tone]}`}>
        {section.title && (
          <h4 className={`mb-2 font-medium ${TONE_TITLE[section.tone]}`}>
            {section.title}
          </h4>
        )}
        {rows}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {section.title && (
        <h4 className="font-medium text-gray-900">{section.title}</h4>
      )}
      {rows}
    </div>
  );
}

function RowView({
  row,
  values,
  setField,
}: {
  row: Row;
  values: FormValues;
  setField: (name: string, value: string | boolean) => void;
}) {
  if (!isFieldArray(row)) {
    return <FieldView field={row} values={values} setField={setField} />;
  }

  const cols = row.reduce((sum, f) => sum + (f.colSpan ?? 1), 0);
  return (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {row.map((field) => (
        <div
          key={field.name}
          style={field.colSpan ? { gridColumn: `span ${field.colSpan}` } : undefined}
        >
          <FieldView field={field} values={values} setField={setField} />
        </div>
      ))}
    </div>
  );
}

function FieldView({
  field,
  values,
  setField,
}: {
  field: FieldDef;
  values: FormValues;
  setField: (name: string, value: string | boolean) => void;
}) {
  const { name, label, type, required, placeholder } = field;

  if (type === "checkbox") {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={name}
          checked={Boolean(values[name])}
          onCheckedChange={(checked) => setField(name, checked === true)}
        />
        <Label htmlFor={name}>{label}</Label>
      </div>
    );
  }

  const value = typeof values[name] === "string" ? (values[name] as string) : "";

  return (
    <div>
      <Label htmlFor={name}>
        {label}
        {required && " *"}
      </Label>
      {type === "select" ? (
        <Select value={value} onValueChange={(v) => setField(name, v)}>
          <SelectTrigger id={name} aria-required={required}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === "textarea" ? (
        <Textarea
          id={name}
          placeholder={placeholder}
          rows={field.rows}
          aria-required={required}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
        />
      ) : (
        <Input
          id={name}
          type={type}
          step={type === "number" ? field.step : undefined}
          placeholder={placeholder}
          aria-required={required}
          value={value}
          onChange={(e) => setField(name, e.target.value)}
        />
      )}
    </div>
  );
}
