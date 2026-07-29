import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Tag,
  Award,
  Home,
} from "lucide-react";
import { Button } from "../ui/Button";
import { useAuth } from "../../contexts/AuthContext";

export const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout("admin");
    navigate("/admin/login");
  };

  const navItems = [
    { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/products", label: "Products", icon: Package },
    { path: "/admin/categories", label: "Categories", icon: Tag },
    { path: "/admin/brands", label: "Brands", icon: Award },
    { path: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { path: "/admin/feedback", label: "Feedback", icon: MessageSquare },
    { path: "/admin/quotes", label: "Quotes", icon: FileText },
    { path: "/admin/customers", label: "Customers", icon: Users },
    { path: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm text-gray-500">Admin Suite</p>
            <h1 className="text-lg font-semibold text-gray-900">Sanitary Solutions</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4" />
                Storefront
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto grid gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-blue-600 text-white shadow"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-700"
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
