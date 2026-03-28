import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "destructive" | "warning";
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "destructive",
}: ConfirmDialogProps) {
  const { t } = useI18n();
  const actualTitle = title || t("confirm.title");
  const actualDescription = description || t("confirm.desc");
  const actualConfirmLabel = confirmLabel || t("confirm.excluir");
  const actualCancelLabel = cancelLabel || t("confirm.cancelar");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="apple-sheet-content border-white/[0.08] rounded-[20px] max-w-[calc(100vw-2rem)] sm:max-w-sm p-0">
        <div className="p-6 space-y-4 text-center">
          <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${variant === "destructive" ? "bg-[#FF453A]/10" : "bg-[#FF9F0A]/10"}`}>
            {variant === "destructive"
              ? <Trash2 className="w-6 h-6 text-[#FF453A]" />
              : <AlertTriangle className="w-6 h-6 text-[#FF9F0A]" />
            }
          </div>
          <h2 className="text-lg font-bold text-white tracking-[-0.02em]">{actualTitle}</h2>
          <p className="text-[0.8125rem] text-[#86868b]">{actualDescription}</p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              className="apple-btn apple-btn-gray flex-1 py-2.5 text-[0.8125rem]"
            >
              {actualCancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); onOpenChange(false); }}
              className="apple-btn apple-btn-destructive flex-1 py-2.5 text-[0.8125rem]"
            >
              {actualConfirmLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
