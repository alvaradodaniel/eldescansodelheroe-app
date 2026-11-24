import { createContext, useContext } from "react";

export interface AdminConfirmationOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

type ConfirmAction = (options: AdminConfirmationOptions) => Promise<boolean>;

export const AdminConfirmContext = createContext<ConfirmAction | null>(null);

export function useAdminConfirm(): ConfirmAction {
  const confirm = useContext(AdminConfirmContext);
  if (!confirm) throw new Error("useAdminConfirm must be used within AdminConfirmProvider.");
  return confirm;
}
