import { SchemaForm } from "./shared/SchemaForm";
import { COMMODITIES_SCHEMA } from "./schemas/commodities.schema";
import type { FormValues } from "./shared/form-schema";

interface CommoditiesFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function CommoditiesForm({
  onSubmit,
  onCancel,
  initialData,
}: CommoditiesFormProps) {
  return (
    <SchemaForm
      schema={COMMODITIES_SCHEMA}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData as FormValues | undefined}
    />
  );
}
