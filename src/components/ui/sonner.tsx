import { Toaster as Sonner } from "sonner";
import { cn } from "@/lib/utils";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ className, richColors = true, style, toastOptions, ...props }: ToasterProps) => {
  return (
    <Sonner
      className={cn("toaster group", className)}
      richColors={richColors}
      style={
        {
          "--normal-bg": "var(--cream)",
          "--normal-border": "var(--wood-dark)",
          "--normal-text": "var(--ink)",
          "--success-bg": "color-mix(in oklab, var(--seat-open) 24%, var(--cream))",
          "--success-border": "var(--seat-open)",
          "--success-text": "var(--wood-dark)",
          "--warning-bg": "color-mix(in oklab, var(--gold) 38%, var(--cream))",
          "--warning-border": "var(--gold-deep)",
          "--warning-text": "var(--wood-dark)",
          "--error-bg": "color-mix(in oklab, var(--destructive) 16%, var(--cream))",
          "--error-border": "var(--destructive)",
          "--error-text": "var(--destructive)",
          ...style,
        } as React.CSSProperties
      }
      toastOptions={{
        ...toastOptions,
        classNames: {
          ...toastOptions?.classNames,
          toast: cn("group toast", toastOptions?.classNames?.toast),
          description: cn(
            "group-[.toast]:text-muted-foreground",
            toastOptions?.classNames?.description,
          ),
          actionButton: cn(
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            toastOptions?.classNames?.actionButton,
          ),
          cancelButton: cn(
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            toastOptions?.classNames?.cancelButton,
          ),
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
