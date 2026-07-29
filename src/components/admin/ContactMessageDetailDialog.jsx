import { Modal } from "../ui/Modal";

const capitalize = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const ContactMessageDetailDialog = ({ open, onClose, message }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={message?.name || "Feedback details"}
    description="Customer contact submission and message details."
    size="xl"
  >
    {message ? (
      <div className="space-y-4 text-sm text-gray-700">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Name</p>
            <p className="mt-1 font-medium text-gray-900">{message.name}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
            <p className="mt-1 font-medium text-gray-900 break-words">{message.email}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Phone</p>
            <p className="mt-1 font-medium text-gray-900">{message.phone || "—"}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
            <p className="mt-1 font-medium text-gray-900">{capitalize(message.status)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Message</p>
          <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap break-words leading-6 text-gray-800">
            {message.message}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs text-gray-500">
          Submitted on {message.createdAt ? new Date(message.createdAt).toLocaleString() : "—"}
        </div>
      </div>
    ) : null}
  </Modal>
);