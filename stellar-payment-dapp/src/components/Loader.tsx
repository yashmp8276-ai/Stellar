import React from "react";

interface LoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const Loader: React.FC<LoaderProps> = ({ message, size = "md" }) => {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <div
        className={`${sizeClasses[size]} border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin`}
      />
      {message && (
        <p className="text-slate-400 text-sm animate-pulse font-medium">
          {message}
        </p>
      )}
    </div>
  );
};
export default Loader;
