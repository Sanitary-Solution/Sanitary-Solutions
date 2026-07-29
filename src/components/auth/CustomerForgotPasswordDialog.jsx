import { useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { PasswordField } from "../ui/PasswordField";
import {
  requestCustomerPasswordResetOtpApi,
  resetCustomerPasswordApi,
  verifyCustomerPasswordResetOtpApi,
} from "../../services/storeApi";

const INITIAL_STATE = {
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
};

export const CustomerForgotPasswordDialog = ({ open, onClose }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [step, setStep] = useState("email");
  const [resetToken, setResetToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const title = useMemo(() => {
    if (step === "otp") return "Check your email";
    if (step === "reset") return "Create a new password";
    if (step === "done") return "Password updated";
    return "Reset your password";
  }, [step]);

  const description = useMemo(() => {
    if (step === "otp") return "Enter the 6-digit code we sent to your registered email.";
    if (step === "reset") return "Choose a new password for your account.";
    if (step === "done") return "Your account password has been updated successfully.";
    return "We will send a one-time code to the email on file if the account exists.";
  }, [step]);

  const closeAndReset = () => {
    setFormData(INITIAL_STATE);
    setStep("email");
    setResetToken("");
    setLoading(false);
    setError("");
    setMessage("");
    onClose?.();
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await requestCustomerPasswordResetOtpApi({ email: formData.email });
      setMessage(`OTP sent to ${response.email || formData.email}.`);
      setStep("otp");
    } catch (apiError) {
      setError(apiError.message || "Unable to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await verifyCustomerPasswordResetOtpApi({
        email: formData.email,
        otp: formData.otp,
      });
      setResetToken(response.resetToken || "");
      setMessage("OTP verified. You can now set a new password.");
      setStep("reset");
    } catch (apiError) {
      setError(apiError.message || "Invalid OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (formData.newPassword.length < 6) {
      setLoading(false);
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setLoading(false);
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      await resetCustomerPasswordApi({
        resetToken,
        newPassword: formData.newPassword,
      });
      setStep("done");
      setMessage("Password reset successfully. You can now sign in with your new password.");
      setFormData(INITIAL_STATE);
      setResetToken("");
    } catch (apiError) {
      setError(apiError.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={closeAndReset} title={title} description={description}>
      {step === "done" ? (
        <div className="space-y-4">
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex justify-end">
            <Button onClick={closeAndReset}>Close</Button>
          </div>
        </div>
      ) : null}

      {step === "email" ? (
        <form className="space-y-4" onSubmit={handleRequestOtp}>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              required
              placeholder="Registered email address"
              value={formData.email}
              onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={closeAndReset}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending code..." : "Send code"}
            </Button>
          </div>
        </form>
      ) : null}

      {step === "otp" ? (
        <form className="space-y-4" onSubmit={handleVerifyOtp}>
          <div>
            <Label>Email on file</Label>
            <Input value={formData.email} disabled />
          </div>
          <div>
            <Label>OTP</Label>
            <Input
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="6-digit code"
              value={formData.otp}
              onChange={(event) => setFormData((prev) => ({ ...prev, otp: event.target.value }))}
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep("email")}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={handleRequestOtp}>
                Resend code
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Checking..." : "Check code"}
              </Button>
            </div>
          </div>
        </form>
      ) : null}

      {step === "reset" ? (
        <form className="space-y-4" onSubmit={handleResetPassword}>
          <div>
            <Label>Email</Label>
            <Input value={formData.email} disabled />
          </div>
          <PasswordField
            label="New password"
            minLength={6}
            required
            value={formData.newPassword}
            onChange={(event) => setFormData((prev) => ({ ...prev, newPassword: event.target.value }))}
          />
          <PasswordField
            label="Confirm password"
            minLength={6}
            required
            value={formData.confirmPassword}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, confirmPassword: event.target.value }))
            }
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex justify-between gap-3">
            <Button type="button" variant="outline" onClick={() => setStep("otp")}>
              Back
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save new password"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
};
