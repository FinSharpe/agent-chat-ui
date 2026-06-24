import { SchemaForm } from "./shared/SchemaForm";
import { REAL_ESTATE_SCHEMA } from "./schemas/real-estate.schema";
import type { FormValues } from "./shared/form-schema";

interface RealEstateFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function RealEstateForm({
  onSubmit,
  onCancel,
  initialData,
}: RealEstateFormProps) {
  return (
    <SchemaForm
      schema={REAL_ESTATE_SCHEMA}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData as FormValues | undefined}
    />
  );
}
