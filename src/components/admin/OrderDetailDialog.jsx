import { Modal } from "../ui/Modal";
import { formatCurrency } from "../../utils/currency";

export const OrderDetailDialog = ({ open, onClose, order }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={`Order ${order?.id || ""}`}
    description="Order details, customer information, and selected variants."
  >
    {order ? (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Customer:</span> {order.customer}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {order.email}
        </p>
        <p>
          <span className="font-semibold">Phone:</span> {order.phone}
        </p>
        <p>
          <span className="font-semibold">Address:</span> {order.address}
        </p>
        <p>
          <span className="font-semibold">Items:</span> {order.items}
        </p>
        {(order.lineItems || []).length > 0 ? (
          <div>
            <p className="font-semibold">Selected variants:</p>
            <div className="mt-1 space-y-1">
              {(order.lineItems || []).map((item, index) => (
                <p key={`${order.id}-${item.name}-${index}`}>
                  {item.name}
                  {item.size ? ` · Variant: ${item.size}` : ""} x {item.quantity}
                </p>
              ))}
            </div>
          </div>
        ) : null}
        <p>
          <span className="font-semibold">Total amount:</span> {formatCurrency(order.total)}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {order.status}
        </p>
        <p>
          <span className="font-semibold">Date:</span> {order.date}
        </p>
      </div>
    ) : null}
  </Modal>
);
