import React from "react";

interface NumberPadProps {
  onSelect: (num: number) => void;
  availableDigits: number[];
}

const NumberPad: React.FC<NumberPadProps> = ({ onSelect, availableDigits }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-9 sm:grid-cols-3 gap-1 sm:gap-2 w-full max-w-md mx-auto">
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onSelect(num)}
          className={`
            aspect-square flex items-center justify-center
            rounded-xl shadow-sm transition-all duration-200
            ${
              availableDigits.includes(num)
                ? "bg-white text-emerald-800 hover:bg-emerald-50 hover:shadow-md hover:-translate-y-0.5 border-2 border-emerald-100 font-bold text-xl sm:text-3xl"
                : "bg-gray-100 text-emerald-400/60 cursor-not-allowed border-2 border-transparent"
            }
          `}
          disabled={!availableDigits.includes(num)}
        >
          {availableDigits.includes(num) ? (
            num
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 sm:h-8 sm:w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
};

export default NumberPad;
