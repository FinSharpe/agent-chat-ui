"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { FormProps } from "../../../types/import-data.types";
import { useFormModal } from "../../shared/form-modal-context";
import { FooterButton, OverlayFooter } from "../../shared/ui";
import { FormSchema, FormValues, isFieldArray } from "./form-schema";
import { SectionView } from "./fields";

type SchemaFormProps = {
  schema: FormSchema;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  initialData?: FormValues;
};

/**
 * Renders a manual investment form from a schema. Owns form state, required +
 * cross-field validation, accessible label wiring, and the reference layout: a
 * scrolling field column with a pinned Cancel / Submit pill footer. Inside a
 * FormModal, Cancel and a successful submit also close the modal.
 */
export function SchemaForm({
  schema,
  onSubmit,
  onCancel,
  initialData,
}: SchemaFormProps) {
  const modal = useFormModal();
  const [values, setValues] = useState<FormValues>(
    initialData ?? schema.initialValues,
  );

  const setField = (name: string, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [name]: value }));

  const visibleSections = schema.sections.filter(
    (s) => !s.visibleWhen || s.visibleWhen(values),
  );

  const handleCancel = () => {
    onCancel();
    modal?.close();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Fields owned by sections that are currently visible. Hidden-section
    // values are pruned from the payload so a discriminator change (e.g.
    // switching insuranceType) can't leak stale fields from a now-hidden
    // section into the submission.
    const visibleFields = visibleSections.flatMap((section) =>
      section.rows.flatMap((r) => (isFieldArray(r) ? r : [r])),
    );
    const visibleFieldNames = new Set(visibleFields.map((f) => f.name));

    // Required-field validation (visible fields only), focusing the first gap.
    for (const field of visibleFields) {
      if (field.required && field.type !== "checkbox") {
        const value = values[field.name];
        if (typeof value !== "string" || value.trim() === "") {
          toast.error(`Please fill in ${field.label}`);
          document.getElementById(field.name)?.focus();
          return;
        }
      }
    }

    const crossFieldError = schema.validate?.(values);
    if (crossFieldError) {
      toast.error(crossFieldError);
      return;
    }

    const visibleValues: FormValues = Object.fromEntries(
      Object.entries(values).filter(([name]) => visibleFieldNames.has(name)),
    );

    onSubmit(visibleValues);
    setValues(schema.initialValues);
    modal?.close();
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="scrollbar-none min-h-0 flex-1 space-y-4 overflow-y-auto p-5 pb-8">
        {visibleSections.map((section, i) => (
          <SectionView
            key={section.title ?? i}
            section={section}
            values={values}
            setField={setField}
          />
        ))}
      </div>

      <OverlayFooter>
        <FooterButton
          variant="secondary"
          onClick={handleCancel}
        >
          Cancel
        </FooterButton>
        <FooterButton type="submit">
          {schema.submitLabel(Boolean(initialData))}
        </FooterButton>
      </OverlayFooter>
    </form>
  );
}

/**
 * Bind a schema into a named form component with the shared `FormProps`
 * contract, so each manual form is a one-line export instead of a duplicated
 * pass-through wrapper.
 */
export function createSchemaForm(schema: FormSchema) {
  return function BoundSchemaForm({
    onSubmit,
    onCancel,
    initialData,
  }: FormProps<FormValues>) {
    return (
      <SchemaForm
        schema={schema}
        onSubmit={onSubmit}
        onCancel={onCancel}
        initialData={initialData}
      />
    );
  };
}
