import { Modal } from "../ui/Modal";
import { formatCurrency } from "../../utils/currency";

export const QuoteDetailDialog = ({ open, onClose, quote }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={`Quote ${quote?.id || ""}`}
    description="Quote request details and selected variants."
  >
    {quote ? (
      <div className="space-y-3 text-sm text-gray-700">
        <p>
          <span className="font-semibold">Customer:</span> {quote.name}
        </p>
        <p>
          <span className="font-semibold">Email:</span> {quote.email}
        </p>
        <p>
          <span className="font-semibold">Phone:</span> {quote.phone}
        </p>
        <p>
          <span className="font-semibold">Products:</span> {quote.products}
        </p>
        {(quote.quoteItems || []).length > 0 ? (
          <div>
            <p className="font-semibold">Selected variants:</p>
            <div className="mt-1 space-y-1">
              {quote.quoteItems.map((item, index) => (
                <p key={`${item.productName}-${index}`}>
                  {item.productName}
                  {item.size ? ` - Variant: ${item.size}` : ""}
                  {item.brand ? ` (${item.brand})` : " (No brand)"} x {item.quantity}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p>
            <span className="font-semibold">Products detail:</span> {quote.productsNeeded}
          </p>
        )}
        <p>
          <span className="font-semibold">Total amount:</span> {formatCurrency(quote.total || 0)}
        </p>
        <p>
          <span className="font-semibold">Status:</span> {quote.status}
        </p>
        <p>
          <span className="font-semibold">Requested:</span> {quote.date}
        </p>
      </div>
    ) : null}
  </Modal>
);
