import React from "react";

interface NumberPadProps {
  onSelect: (num: number) => void;
  availableDigits: number[];
}

const NumberPad: React.FC<NumberPadProps> = ({ onSelect, availableDigits }) => {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <div className="grid grid-cols-3 gap-1 sm:gap-2 w-2xs ">
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onSelect(num)}
          className={`w-12 sm:w-16 h-12 sm:h-16 rounded-md ${
            availableDigits.includes(num)
              ? "bg-gray-200 text-emerald-800 hover:bg-gray-300 font-semibold text-2xl sm:text-4xl"
              : "bg-gray-300 text-gray-500"
          }`}
          disabled={!availableDigits.includes(num)}
        >
          {availableDigits.includes(num) ? (
            num
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              fill="currentColor"
              className="bi bi-check-lg size-6 sm:size-9 mx-1 sm:mx-3"
              viewBox="0 0 16 16"
            >
              <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
};

export default NumberPad;
