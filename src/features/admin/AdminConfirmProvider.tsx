import { useRef, useState, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AdminConfirmContext, type AdminConfirmationOptions } from "./admin-confirm-context";

export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<AdminConfirmationOptions | null>(null);
  const resolveRef = useRef<((confirmed: boolean) => void) | null>(null);

  function confirm(nextOptions: AdminConfirmationOptions): Promise<boolean> {
    return new Promise((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setOptions(nextOptions);
    });
  }

  function settle(confirmed: boolean) {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setOptions(null);
    resolve?.(confirmed);
  }

  return (
    <AdminConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={options !== null} onOpenChange={(open) => !open && settle(false)}>
        <AlertDialogContent
          overlayClassName="bg-black/55"
          className="w-[calc(100vw-2rem)] max-w-md rounded-sm border-0 bg-card p-5 shadow-none pixel-frame sm:rounded-sm sm:p-6"
        >
          {options && (
            <>
              <AlertDialogHeader>
                <div className="mx-auto mb-8 flex size-18 items-center justify-center border-2 border-gold-deep/35 bg-gold/20 text-primary shadow-pixel-sm">
                  <AlertTriangle className="size-12" aria-hidden="true" />
                </div>
                <AlertDialogTitle className="font-display text-2xl font-bold">
                  {options.title}
                </AlertDialogTitle>
                <AlertDialogDescription className="leading-relaxed">
                  {options.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-2 gap-2">
                <AlertDialogCancel asChild>
                  <Button variant="pixel-cream" onClick={() => settle(false)}>
                    {options.cancelLabel ?? "Volver"}
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button
                    variant={options.destructive ? "pixel-danger" : "pixel-positive"}
                    onClick={() => settle(true)}
                  >
                    {options.confirmLabel ?? "Confirmar"}
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </AdminConfirmContext.Provider>
  );
}
