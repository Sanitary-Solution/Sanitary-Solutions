import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";
import { formatCurrency } from "../../utils/currency";
import { createOrderApi } from "../../services/storeApi";

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

export const Checkout = () => {
  const { cart, cartLoading, getCartTotal, clearCart, setCartSyncEmail } = useCart();
  const { user } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isCartEmpty = useMemo(() => cart.length === 0, [cart]);

  useEffect(() => {
    if (user?.role !== "customer") return;

    const [firstName = "", ...rest] = (user.name || "").trim().split(" ");
    const lastName = rest.join(" ");

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName,
      lastName: prev.lastName || lastName,
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
      address: prev.address || user.address || "",
      city: prev.city || user.city || "",
      postalCode: prev.postalCode || user.postalCode || "",
    }));
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isCartEmpty || cartLoading) return;

    setSubmitting(true);
    setError("");

    try {
      await setCartSyncEmail(formData.email, { mergeWithRemote: false });

      await createOrderApi({
        ...formData,
        items: cart.map((item) => ({
          productId: item.product._id || item.product.id,
          quantity: item.quantity,
          size: item.size?.label || "",
        })),
      });

      setSubmitted(true);
      await clearCart();
      setFormData(INITIAL_FORM);
    } catch (apiError) {
      setError(apiError.message || "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl p-10 text-center">
          <p className="text-lg font-semibold text-gray-900">Order placed successfully</p>
          <p className="mt-2 text-sm text-gray-500">We will confirm your delivery schedule shortly.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900">Checkout</h1>
          <p className="text-sm text-gray-500">Provide delivery and billing details.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>First name</Label>
                <Input
                  required
                  placeholder="Ayesha"
                  value={formData.firstName}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, firstName: event.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Last name</Label>
                <Input
                  required
                  placeholder="Khan"
                  value={formData.lastName}
                  onChange={(event) => setFormData((prev) => ({ ...prev, lastName: event.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                required
                placeholder="ayesha@email.com"
                value={formData.email}
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                Order confirmation email uses your signed-in account.
              </p>
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                required
                placeholder="+92 300 123 4567"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <Label>Delivery address</Label>
              <Input
                required
                placeholder="House 10, DHA Phase 5, Karachi"
                value={formData.address}
                onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input
                  required
                  placeholder="Karachi"
                  value={formData.city}
                  onChange={(event) => setFormData((prev) => ({ ...prev, city: event.target.value }))}
                />
              </div>
              <div>
                <Label>Postal code</Label>
                <Input
                  required
                  placeholder="75500"
                  value={formData.postalCode}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                />
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={submitting || isCartEmpty || cartLoading}>
              {submitting ? "Placing order..." : "Confirm order"}
            </Button>
          </form>
        </Card>

        <Card className="h-fit p-6">
          <p className="text-sm font-semibold text-gray-900">Selected variants</p>
          <div className="mt-4 space-y-4">
            {cart.map((item) => (
              <div
                key={`${item.product.id}-${item.size?.label || "default"}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">
                  {item.product.name}
                  {item.size?.label ? ` · Variant: ${item.size.label}` : ""}
                </span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(item.product.price * item.quantity)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 text-base font-semibold text-gray-900">
              Total: {formatCurrency(getCartTotal())}
            </div>
            {isCartEmpty ? (
              <p className="text-sm text-amber-700">Your cart is empty. Add products before checkout.</p>
            ) : null}
            {cartLoading ? (
              <p className="text-sm text-gray-500">Loading your latest cart...</p>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
};
