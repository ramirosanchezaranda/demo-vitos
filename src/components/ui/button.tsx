import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "ghost" | "success" | "danger" | "warning";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-lg text-base font-semibold transition-all duration-200 " +
      "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:scale-105 " +
      "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed " +
      "active:scale-95 cursor-pointer shadow-md hover:shadow-lg";

    const sizes = 
      size === "sm" ? "h-10 px-4 text-sm" : 
      size === "md" ? "h-12 px-6" : 
      "h-14 px-8 text-lg";
    
    const styles =
      variant === "default"
        ? "bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-700"
        : variant === "secondary"
          ? "bg-gray-500 text-white hover:bg-gray-600 border-2 border-gray-600"
          : variant === "success"
            ? "bg-green-600 text-white hover:bg-green-700 border-2 border-green-700"
            : variant === "danger"
              ? "bg-red-600 text-white hover:bg-red-700 border-2 border-red-700"
              : variant === "warning"
                ? "bg-orange-500 text-white hover:bg-orange-600 border-2 border-orange-600"
                : "hover:bg-accent";

    return <button ref={ref} className={cn(base, sizes, styles, className)} {...props} />;
  }
);
Button.displayName = "Button";
