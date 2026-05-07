import { ReactNode } from "react";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";

interface FieldHintProps {
  label: ReactNode;
  hint?: string;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}

/**
 * Standard label + helper text + tooltip "?" combo for forms.
 * Pulls hint copy from src/lib/formHints.ts so wording stays consistent.
 */
export default function FieldHint({ label, hint, htmlFor, required, className = "" }: FieldHintProps) {
  return (
    <div className={`mb-1 ${className}`}>
      <div className="flex items-center gap-1.5">
        <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        {hint && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" tabIndex={-1} aria-label="More info"
                className="text-muted-foreground/60 hover:text-foreground transition-colors">
                <HelpCircle className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[260px] text-xs">{hint}</TooltipContent>
          </Tooltip>
        )}
      </div>
      {hint && <p className="text-[10px] text-muted-foreground/80 mt-0.5 leading-snug">{hint}</p>}
    </div>
  );
}
