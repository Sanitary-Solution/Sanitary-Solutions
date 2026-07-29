import { useEffect, useMemo, useState } from "react";
import { Eye, Filter, Search, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { Table, TBody, Td, Th, THead } from "../../components/ui/Table";
import { deleteContactApi, getContactsApi } from "../../services/adminApi";
import { ContactMessageDetailDialog } from "../../components/admin/ContactMessageDetailDialog";

const STATUS_OPTIONS = ["all", "new", "in_progress", "resolved"];

const capitalize = (value = "") => value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());

export const Feedback = () => {
  const [messages, setMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesStatus = statusFilter === "all" ? true : message.status === statusFilter;
      const haystack = `${message.name} ${message.email} ${message.phone} ${message.message} ${message.status}`.toLowerCase();
      return matchesStatus && haystack.includes(searchQuery.toLowerCase());
    });
  }, [messages, searchQuery, statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await getContactsApi({ page: 1, limit: 500, status: statusFilter });
      setMessages(data);
    } catch (apiError) {
      setError(apiError.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const handleDelete = async (message) => {
    const confirmed = window.confirm(`Delete feedback from "${message.name}"?`);
    if (!confirmed) return;

    setError("");
    setFeedback("");

    try {
      await deleteContactApi(message._id);
      setMessages((prev) => prev.filter((item) => item._id !== message._id));
      setFeedback("Feedback deleted successfully.");
    } catch (apiError) {
      setError(apiError.message || "Failed to delete feedback.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Feedback</h1>
          <p className="text-sm text-gray-500">View customer contact submissions and remove old entries.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {capitalize(status)}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              className="w-full text-sm text-gray-700 outline-none sm:w-60"
              placeholder="Search feedback"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <Card className="p-4">
        {loading ? <p className="text-sm text-gray-500">Loading feedback...</p> : null}
        {feedback ? <p className="mb-4 text-sm text-emerald-600">{feedback}</p> : null}
        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        <Table>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Status</Th>
              <Th>Date</Th>
              <Th></Th>
            </tr>
          </THead>
          <TBody>
            {filteredMessages.map((message) => (
              <tr key={message._id} className="border-b border-gray-100 align-top">
                <Td className="font-semibold text-gray-900">{message.name}</Td>
                <Td>{message.email}</Td>
                <Td>{message.phone || "—"}</Td>
                <Td>{capitalize(message.status)}</Td>
                <Td>{message.createdAt ? new Date(message.createdAt).toLocaleDateString() : ""}</Td>
                <Td>
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedMessage(message)}>
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(message)}>
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

      <ContactMessageDetailDialog
        open={Boolean(selectedMessage)}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
      />
    </div>
  );
};
