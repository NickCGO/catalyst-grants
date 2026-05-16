const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken?.startsWith("pk_test_")) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
      Test mode is active — use card <code className="font-mono">4242 4242 4242 4242</code> with any future expiry and any CVC.
    </div>
  );
}
