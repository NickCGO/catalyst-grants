import { useEffect, useState } from "react";
import { isTestMode } from "@/lib/stripe";

export function PaymentTestModeBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // Re-evaluate after stripe config loads
    const t = setTimeout(() => setShow(isTestMode()), 800);
    setShow(isTestMode());
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;
  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
      Test mode is active — use card <code className="font-mono">4242 4242 4242 4242</code> with any future expiry and any CVC.
    </div>
  );
}
