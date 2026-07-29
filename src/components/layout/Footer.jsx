import { Droplet, Mail, MapPin, Phone } from "lucide-react";

export const Footer = () => (
  <footer className="border-t border-gray-200 bg-white">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <Droplet className="h-7 w-7 text-blue-600" />
            <div>
              <p className="text-lg font-semibold text-gray-900">Sanitary Solutions</p>
              <p className="text-xs text-gray-500">Trusted since 2004</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">
            Premium sanitaryware, plumbing essentials, and professional-grade accessories delivered with
            expert guidance.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Showroom</p>
          <ul className="mt-4 space-y-3 text-sm text-gray-600">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              27 Mall Road, Clifton, Karachi
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-blue-600" />
              +92 321 487 0560
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-blue-600" />
              sanitarysolutions9@gmail.com
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>Installation guidance</li>
            <li>Bulk procurement</li>
            <li>Warranty claims</li>
            <li>Design consultation</li>
          </ul>
          <p className="mt-6 text-xs text-gray-400">© 2026 Sanitary Solutions. All rights reserved.</p>
        </div>
      </div>
    </div>
  </footer>
);
