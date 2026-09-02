import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  blue?: boolean;
}

export default function Card({ children, className = "", blue }: CardProps) {
  return (
    <div
      className={`rounded-3xl p-5 shadow-sm ${
        blue
          ? "bg-gradient-to-br from-primary to-primary-dark text-white"
          : "bg-white/90 backdrop-blur-sm"
      } ${className}`}
    >
      {children}
    </div>
  );
}
