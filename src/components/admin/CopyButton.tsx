import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: "secondary" | "primary" | "ghost";
}

const variantClasses = {
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200",
  primary: "bg-slate-900 text-white hover:bg-slate-800",
  ghost: "text-slate-600 hover:bg-slate-100",
};

export default function CopyButton({
  text,
  label = "Copy",
  copiedLabel = "Copied!",
  className = "",
  variant = "secondary",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    });
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${variantClasses[variant]} ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
