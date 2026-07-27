import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { PasswordField } from "../../components/ui/PasswordField";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  address: "",
  city: "",
  postalCode: "",
};

export const CustomerSignup = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signupCustomer } = useAuth();
  const navigate = useNavigate();

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const result = await signupCustomer(formData);
    setLoading(false);

    if (result.success) {
      navigate("/orders/track");
      return;
    }

    setError(result.message || "Unable to create account.");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4 py-10">
        <Card className="w-full max-w-2xl p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Create customer account</h1>
          <p className="text-sm text-gray-500">Sign up to track orders and speed up checkout.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <Label>Full name</Label>
              <Input
                value={formData.name}
                onChange={(event) => handleChange("name", event.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(event) => handleChange("email", event.target.value)}
                  required
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(event) => handleChange("phone", event.target.value)}
                  required
                />
              </div>
            </div>
            <PasswordField
              label="Password"
              minLength={6}
              value={formData.password}
              onChange={(event) => handleChange("password", event.target.value)}
              required
            />
            <div>
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(event) => handleChange("address", event.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(event) => handleChange("city", event.target.value)}
                />
              </div>
              <div>
                <Label>Postal code</Label>
                <Input
                  value={formData.postalCode}
                  onChange={(event) => handleChange("postalCode", event.target.value)}
                />
              </div>
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
};
