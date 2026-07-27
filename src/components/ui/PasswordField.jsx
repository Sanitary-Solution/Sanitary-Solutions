import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";

export const PasswordField = ({ label, className, inputClassName, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      {label ? <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label> : null}
      <div className="relative">
        <Input type={visible ? "text" : "password"} className={`pr-12 ${inputClassName || ""}`} {...props} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 h-full rounded-l-none px-3"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
