import React from "react";

interface AdPlaceholderProps {
  width?: number | string;
  height?: number | string;
  label?: string;
  className?: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({
  width = 320,
  height = 50,
  label = "Ad Space",
  className = "",
}) => {
  return (
    <div
      className={`bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-gray-500 font-medium text-sm ${className}`}
      style={{ width, height }}
    >
      {label}
    </div>
  );
};

export default AdPlaceholder;
