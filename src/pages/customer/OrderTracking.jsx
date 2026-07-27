import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { getMyOrdersApi, getMyQuotesApi } from "../../services/storeApi";
import { formatCurrency } from "../../utils/currency";

const ORDER_STATUS_OPTIONS = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];
const QUOTE_STATUS_OPTIONS = ["all", "pending", "responded", "converted", "rejected"];

const getStatusClasses = (status) => {
  if (status === "delivered" || status === "converted") return "bg-emerald-50 text-emerald-700";
  if (status === "shipped" || status === "responded") return "bg-blue-50 text-blue-700";
  if (status === "processing") return "bg-amber-50 text-amber-700";
  if (status === "cancelled" || status === "rejected") return "bg-red-50 text-red-700";
  return "bg-gray-100 text-gray-700";
};

const capitalize = (value = "") => value.charAt(0).toUpperCase() + value.slice(1);

export const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [quoteStatus, setQuoteStatus] = useState("all");

  const loadTracking = async ({ showLoader = false } = {}) => {
    try {
      if (showLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const [ordersResponse, quotesResponse] = await Promise.all([
        getMyOrdersApi({
          search: search.trim(),
          status: orderStatus,
          page: 1,
          limit: 100,
        }),
        getMyQuotesApi({
          search: search.trim(),
          status: quoteStatus,
          page: 1,
          limit: 100,
        }),
      ]);

      setOrders(ordersResponse.data || []);
      setQuotes(quotesResponse.data || []);
    } catch (apiError) {
      setError(apiError.message || "Unable to load orders and quotes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTracking();
  }, []);

  const ordersCount = useMemo(() => orders.length, [orders]);
  const quotesCount = useMemo(() => quotes.length, [quotes]);

  const handleTrack = async (event) => {
    event.preventDefault();
    await loadTracking({ showLoader: true });
  };

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900">Order and quote tracking</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track order delivery status and quote status updates from admin.
        </p>

        <Card className="mt-6 p-5">
          <form className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]" onSubmit={handleTrack}>
            <div>
              <Label>Order or quote number</Label>
              <Input
                placeholder="e.g. ORD000123 or QT000456"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div>
              <Label>Order status</Label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={orderStatus}
                onChange={(event) => setOrderStatus(event.target.value)}
              >
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {capitalize(option)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Quote status</Label>
              <select
                className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                value={quoteStatus}
                onChange={(event) => setQuoteStatus(event.target.value)}
              >
                {QUOTE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {capitalize(option)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={loading || refreshing}>
                {refreshing ? "Searching..." : "Track"}
              </Button>
            </div>
          </form>
        </Card>

        {loading ? (
          <Card className="mt-6 p-6 text-sm text-gray-500">Loading your tracking data...</Card>
        ) : null}
        {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}

        {!loading && !error ? (
          <div className="mt-6 space-y-8">
            <section className="space-y-4">
              <p className="text-sm font-semibold text-gray-800">
                Orders ({ordersCount})
              </p>

              {orders.length === 0 ? (
                <Card className="p-6 text-sm text-gray-500">No matching orders found.</Card>
              ) : null}

              {orders.map((order) => (
                <Card key={order._id || order.orderNumber} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Order</p>
                      <p className="text-lg font-semibold text-gray-900">{order.orderNumber}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(order.status)}`}
                    >
                      {capitalize(order.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm text-gray-700 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
                      <p className="font-medium">{order.date}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Items</p>
                      <p className="font-medium">{order.items}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Total</p>
                      <p className="font-medium">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="text-sm font-semibold text-gray-900">Selected variants</p>
                    <div className="mt-2 space-y-2">
                      {(order.lineItems || []).map((item, index) => (
                        <div
                          key={`${order.orderNumber}-${item.name}-${index}`}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {item.name}
                            {item.size ? ` · Variant: ${item.size}` : ""} x {item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </section>

            <section className="space-y-4">
              <p className="text-sm font-semibold text-gray-800">
                Quotes ({quotesCount})
              </p>

              {quotes.length === 0 ? (
                <Card className="p-6 text-sm text-gray-500">No matching quotes found.</Card>
              ) : null}

              {quotes.map((quote) => (
                <Card key={quote._id || quote.quoteNumber} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-500">Quote</p>
                      <p className="text-lg font-semibold text-gray-900">{quote.quoteNumber}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(quote.status)}`}
                    >
                      {capitalize(quote.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-4 text-sm text-gray-700 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Date</p>
                      <p className="font-medium">{quote.date}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Products</p>
                      <p className="font-medium">{quote.products}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-500">Estimated total</p>
                      <p className="font-medium">{formatCurrency(quote.total || 0)}</p>
                    </div>
                  </div>

                  {(quote.quoteItems || []).length > 0 ? (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <p className="text-sm font-semibold text-gray-900">Quoted products</p>
                      <div className="mt-2 space-y-2">
                        {quote.quoteItems.map((item, index) => (
                          <div
                            key={`${quote.quoteNumber}-${item.productName}-${index}`}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600">
                              {item.productName} ({item.brand || "No brand"}) x {item.quantity}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatCurrency(item.lineTotal || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </Card>
              ))}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
};
