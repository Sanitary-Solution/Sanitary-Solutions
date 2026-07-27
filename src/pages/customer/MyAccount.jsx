import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { PasswordField } from "../../components/ui/PasswordField";

const INITIAL_PROFILE = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
};

const INITIAL_PASSWORD = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const MyAccount = () => {
  const { user, updateCustomerProfile, changeCustomerPassword } = useAuth();
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [passwordForm, setPasswordForm] = useState(INITIAL_PASSWORD);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!user || user.role !== "customer") return;

    setProfile({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      city: user.city || "",
      postalCode: user.postalCode || "",
    });
  }, [user]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError("");
    setProfileMessage("");

    const result = await updateCustomerProfile({
      name: profile.name,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      postalCode: profile.postalCode,
    });

    setProfileSaving(false);
    if (result.success) {
      setProfileMessage(result.message || "Profile updated successfully.");
    } else {
      setProfileError(result.message || "Unable to update profile.");
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordMessage("");

    if (passwordForm.newPassword.length < 6) {
      setPasswordSaving(false);
      setPasswordError("New password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordSaving(false);
      setPasswordError("New password and confirm password do not match.");
      return;
    }

    const result = await changeCustomerPassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    );

    setPasswordSaving(false);
    if (result.success) {
      setPasswordMessage(result.message || "Password changed successfully.");
      setPasswordForm(INITIAL_PASSWORD);
    } else {
      setPasswordError(result.message || "Unable to change password.");
    }
  };

  return (
    <div className="bg-slate-50">
      <div className="container mx-auto grid gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <Card className="p-6">
          <h1 className="text-2xl font-semibold text-gray-900">My account</h1>
          <p className="text-sm text-gray-500">Update your profile details used for delivery and orders.</p>

          <form className="mt-6 space-y-4" onSubmit={handleProfileSubmit}>
            <div>
              <Label>Full name</Label>
              <Input
                required
                value={profile.name}
                onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} disabled />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                required
                value={profile.phone}
                onChange={(event) => setProfile((prev) => ({ ...prev, phone: event.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={profile.address}
                onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input
                  value={profile.city}
                  onChange={(event) => setProfile((prev) => ({ ...prev, city: event.target.value }))}
                />
              </div>
              <div>
                <Label>Postal code</Label>
                <Input
                  value={profile.postalCode}
                  onChange={(event) =>
                    setProfile((prev) => ({ ...prev, postalCode: event.target.value }))
                  }
                />
              </div>
            </div>
            {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
            {profileMessage ? <p className="text-sm text-emerald-700">{profileMessage}</p> : null}
            <Button type="submit" className="w-full" disabled={profileSaving}>
              {profileSaving ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </Card>

        <Card className="h-fit p-6">
          <h2 className="text-lg font-semibold text-gray-900">Change password</h2>
          <p className="text-sm text-gray-500">Use a strong password with at least 6 characters.</p>

          <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
            <PasswordField
              label="Current password"
              required
              value={passwordForm.currentPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
              }
            />
            <PasswordField
              label="New password"
              minLength={6}
              required
              value={passwordForm.newPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
              }
            />
            <PasswordField
              label="Confirm new password"
              minLength={6}
              required
              value={passwordForm.confirmPassword}
              onChange={(event) =>
                setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
              }
            />
            {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
            {passwordMessage ? <p className="text-sm text-emerald-700">{passwordMessage}</p> : null}
            <Button type="submit" className="w-full" disabled={passwordSaving}>
              {passwordSaving ? "Updating..." : "Update password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
