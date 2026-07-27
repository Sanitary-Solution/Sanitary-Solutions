import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { PasswordField } from "../../components/ui/PasswordField";

export const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    const result = await login("admin", username, password);
    setLoading(false);
    if (result.success) {
      const redirectTo = location.state?.from?.pathname || "/admin";
      navigate(redirectTo);
    } else {
      setError(result.message || "Invalid admin credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Admin sign in</h1>
          <p className="text-sm text-gray-500">Use your admin credentials to continue.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <PasswordField label="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full">
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-700">
            Default credentials: admin / admin123 (unless changed in settings).
          </div>
        </Card>
      </div>
    </div>
  );
};
