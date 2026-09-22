"use client";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { FormValues } from "../forms/shared/form-schema";
import { FormModal } from "../shared/FormModal";
import type { ManualAssetConfig } from "./manual-assets";

/**
 * Opens a manual asset's add/edit form in the shared FormModal. FormModal
 * owns its trigger and open state, so this places it where the reference puts
 * the control (`look` picks the restyle in import.css) and closes it after a
 * save or cancel by remounting it — then hands focus back to the fresh trigger.
 */
export function ManualAssetFormTrigger({
  config,
  look,
  triggerText,
  initialData,
  onSave,
}: {
  config: ManualAssetConfig;
  look: "connect" | "link" | "icon-edit";
  triggerText: string;
  initialData?: FormValues;
  onSave: (data: FormValues) => void;
}) {
  const [instance, setInstance] = useState(0);
  const slotRef = useRef<HTMLSpanElement>(null);
  const { Form } = config;
  const isEdit = Boolean(initialData);

  useEffect(() => {
    if (instance > 0) slotRef.current?.querySelector("button")?.focus();
  }, [instance]);

  const close = () => setInstance((n) => n + 1);

  return (
    <span
      ref={slotRef}
      className={`import-slot-${look} inline-flex shrink-0 items-center`}
    >
      <FormModal
        key={instance}
        title={`${isEdit ? "Edit" : "Add"} ${config.title}`}
        description={config.formDescription}
        icon={config.formIcon}
        triggerText={triggerText}
      >
        <Form
          initialData={initialData}
          onCancel={close}
          onSubmit={(data) => {
            onSave(data);
            toast.success(`${config.title} ${isEdit ? "updated" : "saved"}`);
            close();
          }}
        />
      </FormModal>
    </span>
  );
}
