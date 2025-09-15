// components/CheckboxDropdown.tsx
"use client";

import { Dispatch, SetStateAction, useState, useRef, useEffect } from "react";

type Option = {
  id: string;
  label: string;
};

type CheckboxDropdownProps = {
  label: string;
  options: Option[];
  selectedIds: string[];
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
  error?: string;
};

export default function CheckboxDropdown({
  label,
  options,
  selectedIds,
  setSelectedIds,
  error,
}: CheckboxDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleCheckbox = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((sid) => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className="flex flex-col gap-2 w-full md:w-1/2 relative"
      ref={dropdownRef}
    >
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="relative cursor-pointer" onClick={() => setOpen(!open)}>
        <div className="flex justify-between items-center p-2 border ring-[1.5px] ring-gray-300 rounded-md text-sm bg-white hover:ring-blue-400 transition">
          {selectedIds.length > 0
            ? (() => {
                const selectedOptions = options.filter((opt) =>
                  selectedIds.includes(opt.id)
                );
                if (selectedOptions.length === 1) {
                  return selectedOptions[0].label;
                } else {
                  return `${selectedOptions[0].label} +${
                    selectedOptions.length - 1
                  } more`;
                }
              })()
            : "Select..."}

          <span className="ml-2 text-gray-400">{open ? "▲" : "▼"}</span>
        </div>

        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white border ring-[1.5px] ring-gray-300 rounded-md shadow-lg p-2">
            {options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 text-sm cursor-pointer p-1 hover:bg-gray-100 rounded"
              >
                <input
                  type="checkbox"
                  value={option.id}
                  checked={selectedIds.includes(option.id)}
                  onChange={() => toggleCheckbox(option.id)}
                  className="w-4 h-4 accent-blue-500"
                />
                {option.label}
              </label>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
