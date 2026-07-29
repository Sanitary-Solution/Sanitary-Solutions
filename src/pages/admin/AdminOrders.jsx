import { useEffect, useMemo, useState } from "react";
import { Filter, Search, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Table, TBody, Td, Th, THead } from "../../components/ui/Table";
import { OrderDetailDialog } from "../../components/admin/OrderDetailDialog";
import { formatCurrency } from "../../utils/currency";
import { deleteOrderApi, getOrdersApi, updateOrderStatusApi } from "../../services/adminApi";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered"];

export const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === "all" ? true : order.status === statusFilter;
      const matchesSearch = `${order.id} ${order.customer} ${order.email} ${order.phone} ${order.status}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getOrdersApi({ page: 1, limit: 500, status: "all" });
      setOrders(data);
    } catch (apiError) {
      setError(apiError.message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDelete = async (order) => {
    const confirmed = window.confirm(`Delete order "${order.id}"?`);
    if (!confirmed) return;

    setError("");
    setFeedback("");

    try {
      await deleteOrderApi(order.id);
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      setFeedback("Order deleted successfully.");
    } catch (apiError) {
      setError(apiError.message || "Failed to delete order.");
    }
  };

  const handleStatusChange = async (order, nextStatus) => {
    setError("");
    setFeedback("");

    try {
      const updated = await updateOrderStatusApi(order.id, nextStatus);
      setOrders((prev) => prev.map((item) => (item.id === order.id ? updated : item)));
      setFeedback("Order status updated.");
    } catch (apiError) {
      setError(apiError.message || "Failed to update order status.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">
            Search, view details, edit status, and delete orders.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All</option>
              {ORDER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              className="w-full text-sm text-gray-700 outline-none sm:w-60"
              placeholder="Search orders"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="p-4">
        {loading ? <p className="text-sm text-gray-500">Loading orders...</p> : null}
        {feedback ? <p className="mb-4 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <Table>
          <THead>
            <tr>
              <Th>Order</Th>
              <Th>Customer</Th>
              <Th>Email</Th>
              <Th>Status</Th>
              <Th>Total amount</Th>
              <Th>Date</Th>
              <Th></Th>
            </tr>
          </THead>
          <TBody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-gray-100">
                <Td className="font-semibold text-gray-900">{order.id}</Td>
                <Td>{order.customer}</Td>
                <Td>{order.email}</Td>
                <Td>
                  {order.status === "cancelled" ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                      cancelled
                    </span>
                  ) : (
                    <Select
                      value={order.status}
                      onChange={(event) => handleStatusChange(order, event.target.value)}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  )}
                </Td>
                <Td>{formatCurrency(order.total)}</Td>
                <Td>{order.date}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedOrder(order)}>
                      View
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(order)}>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </TBody>
        </Table>
      </Card>

      <OrderDetailDialog
        open={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
      />
    </div>
  );
};
