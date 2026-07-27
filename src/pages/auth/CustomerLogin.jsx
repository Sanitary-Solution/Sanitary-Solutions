import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { PasswordField } from "../../components/ui/PasswordField";
import { CustomerForgotPasswordDialog } from "../../components/auth/CustomerForgotPasswordDialog";

export const CustomerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await login("customer", email, password);
    setLoading(false);

    if (result.success) {
      const redirectTo = location.state?.from?.pathname || "/orders/track";
      navigate(redirectTo);
      return;
    }

    setError(result.message || "Invalid email or password.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Customer sign in</h1>
          <p className="text-sm text-gray-500">Track your orders and manage your account.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
            <PasswordField label="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <div className="text-right">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                onClick={() => setForgotOpen(true)}
              >
                Forgot password?
              </button>
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            New here?{" "}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-700">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
      <CustomerForgotPasswordDialog open={forgotOpen} onClose={() => setForgotOpen(false)} />
    </div>
  );
};
