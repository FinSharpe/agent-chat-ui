import { createContext, useContext } from "react";

/** Lets the form inside a FormModal close it (Cancel, successful submit). */
export const FormModalContext = createContext<{ close: () => void } | null>(
  null,
);

/** The enclosing FormModal's controls, or null outside one. */
export const useFormModal = () => useContext(FormModalContext);
