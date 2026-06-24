import { SchemaForm } from "./shared/SchemaForm";
import { FIXED_DEPOSITS_SCHEMA } from "./schemas/fixed-deposits.schema";
import type { FormValues } from "./shared/form-schema";

interface FixedDepositsFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

export function FixedDepositsForm({
  onSubmit,
  onCancel,
  initialData,
}: FixedDepositsFormProps) {
  return (
    <SchemaForm
      schema={FIXED_DEPOSITS_SCHEMA}
      onSubmit={onSubmit}
      onCancel={onCancel}
      initialData={initialData as FormValues | undefined}
    />
  );
}
