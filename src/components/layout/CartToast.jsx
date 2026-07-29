import { useCart } from "../../contexts/CartContext";

export const CartToast = () => {
  const { cartNotice, dismissCartNotice } = useCart();

  if (!cartNotice) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl bg-gray-900 p-4 text-white shadow-2xl ring-1 ring-black/10 sm:w-full">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-emerald-500/15 p-2 text-emerald-400">OK</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Added to cart</p>
          <p className="mt-1 text-sm text-gray-200">
            {cartNotice.productName}
            {cartNotice.variantLabel ? ` - Variant: ${cartNotice.variantLabel}` : ""}
          </p>
          {cartNotice.quantity > 1 ? (
            <p className="mt-1 text-xs text-gray-400">Quantity: {cartNotice.quantity}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
          onClick={dismissCartNotice}
          aria-label="Dismiss cart notification"
        >
          x
        </button>
      </div>
    </div>
  );
};
