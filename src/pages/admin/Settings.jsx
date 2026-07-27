import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { getSettingsApi, updateSettingsApi } from "../../services/adminApi";
import { useAuth } from "../../contexts/AuthContext";
import { PasswordField } from "../../components/ui/PasswordField";

const DEFAULT_SETTINGS = {
  storeName: "",
  supportEmail: "",
  storeAddress: "",
  phoneNumber: "",
  lowStockThreshold: 0,
};

export const Settings = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const { changeAdminPassword } = useAuth();

  const fetchSettings = async () => {
    try {
      setSettingsLoading(true);
      setSettingsError("");
      const data = await getSettingsApi();
      setSettings({
        storeName: data.storeName || "",
        supportEmail: data.supportEmail || "",
        storeAddress: data.storeAddress || "",
        phoneNumber: data.phoneNumber || "",
        lowStockThreshold: data.lowStockThreshold || 0,
      });
    } catch (apiError) {
      setSettingsError(apiError.message || "Failed to load settings.");
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setSettingsMessage("");
    setSettingsError("");

    try {
      const updated = await updateSettingsApi({
        ...settings,
        lowStockThreshold: Number(settings.lowStockThreshold) || 0,
      });
      setSettings({
        storeName: updated.storeName || "",
        supportEmail: updated.supportEmail || "",
        storeAddress: updated.storeAddress || "",
        phoneNumber: updated.phoneNumber || "",
        lowStockThreshold: updated.lowStockThreshold || 0,
      });
      setSettingsMessage("Settings saved successfully.");
    } catch (apiError) {
      setSettingsError(apiError.message || "Failed to save settings.");
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    setPasswordLoading(true);
    const result = await changeAdminPassword(passwordForm.currentPassword, passwordForm.newPassword);
    setPasswordLoading(false);

    if (!result.success) {
      setPasswordError(result.message);
      return;
    }

    setPasswordMessage(result.message);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Update store details and admin security.</p>
      </div>

      <Card className="max-w-2xl p-6">
        <form className="space-y-4" onSubmit={handleSettingsSubmit}>
          <div>
            <Label>Store name</Label>
            <Input
              value={settings.storeName}
              onChange={(event) => setSettings((prev) => ({ ...prev, storeName: event.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Support email</Label>
            <Input
              type="email"
              value={settings.supportEmail}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, supportEmail: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label>Store address</Label>
            <Input
              value={settings.storeAddress}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, storeAddress: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label>Phone number</Label>
            <Input
              value={settings.phoneNumber}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, phoneNumber: event.target.value }))
              }
              required
            />
          </div>
          <div>
            <Label>Low stock threshold</Label>
            <Input
              type="number"
              min="0"
              value={settings.lowStockThreshold}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, lowStockThreshold: event.target.value }))
              }
              required
            />
          </div>
          {settingsLoading ? <p className="text-sm text-gray-500">Loading settings...</p> : null}
          {settingsError ? <p className="text-sm text-red-600">{settingsError}</p> : null}
          {settingsMessage ? <p className="text-sm text-emerald-600">{settingsMessage}</p> : null}
          <Button type="submit">Save changes</Button>
        </form>
      </Card>

      <Card className="max-w-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900">Change admin password</h2>
        <p className="mb-4 text-sm text-gray-500">
          Update admin login password used in the admin sign in page.
        </p>
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          <PasswordField
            label="Current password"
            value={passwordForm.currentPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
            }
            required
          />
          <PasswordField
            label="New password"
            value={passwordForm.newPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
            }
            required
          />
          <PasswordField
            label="Confirm new password"
            value={passwordForm.confirmPassword}
            onChange={(event) =>
              setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
            required
          />
          {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
          {passwordMessage ? <p className="text-sm text-emerald-600">{passwordMessage}</p> : null}
          <Button type="submit">{passwordLoading ? "Changing..." : "Change password"}</Button>
        </form>
      </Card>
    </div>
  );
};
