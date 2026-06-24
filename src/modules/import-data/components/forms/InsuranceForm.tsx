import { SchemaForm } from "./shared/SchemaForm";
import { INSURANCE_SCHEMA } from "./schemas/insurance.schema";
import type { FormValues } from "./shared/form-schema";

interface InsuranceFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function InsuranceForm({
  onSubmit,
  onCancel,
  initialData,
}: InsuranceFormProps) {
  return (
    <SchemaForm
      schema={INSURANCE_SCHEMA}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData as FormValues | undefined}
    />
  );
}
