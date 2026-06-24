import { SchemaForm } from "./shared/SchemaForm";
import { OTHER_INVESTMENTS_SCHEMA } from "./schemas/other-investments.schema";
import type { FormValues } from "./shared/form-schema";

interface OtherInvestmentsFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function OtherInvestmentsForm({
  onSubmit,
  onCancel,
  initialData,
}: OtherInvestmentsFormProps) {
  return (
    <SchemaForm
      schema={OTHER_INVESTMENTS_SCHEMA}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData as FormValues | undefined}
    />
  );
}
