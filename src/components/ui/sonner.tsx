import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner";

export function Toaster() {
  return <SonnerToaster richColors closeButton />;
}

export function toast(title: string, opts?: { description?: string }) {
  sonnerToast(title, { description: opts?.description });
}
