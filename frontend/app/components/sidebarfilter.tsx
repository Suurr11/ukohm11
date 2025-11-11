"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarFilterProps {
  selectedScale: string;
  onScaleChange: (scale: string) => void;
  limitedOnly: boolean;
  onLimitedChange: (limited: boolean) => void;
}

export default function SidebarFilter({
  selectedScale,
  onScaleChange,
  limitedOnly,
  onLimitedChange,
}: SidebarFilterProps) {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    scale: true,
    limited: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Skala sesuai data backend
  const scales = ["All", "1:64", "1:43", "1:18", "1:24", "1:12"];

  return (
    <aside className="w-64 pr-6 border-r border-gray-200">
      {/* HEADER */}
      <h2 className="text-3xl font-extrabold text-gray-900 mb-8">
        New Arrivals
      </h2>

      {/* FILTER SCALE */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <button
          onClick={() => toggleSection("scale")}
          className="w-full flex justify-between items-center text-lg font-semibold text-gray-700 hover:text-black transition cursor-pointer"
        >
          <span>Scale</span>
          <motion.span
            animate={{ rotate: openSections.scale ? 45 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {openSections.scale && (
            <motion.ul
              key="scale-list"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-4 space-y-3 overflow-hidden"
            >
              {scales.map((scale) => (
                <motion.li key={scale} whileTap={{ scale: 0.95 }} whileHover={{ x: 5 }}>
                  <button
                    onClick={() => onScaleChange(scale)}
                    className={`block w-full text-left text-[18px] transition relative cursor-pointer
                      ${
                        selectedScale === scale
                          ? "text-black font-semibold"
                          : "text-gray-500 hover:text-black"
                      }`}
                  >
                    {scale === "All" ? "All Scales" : `Scale ${scale}`}
                    {selectedScale === scale && (
                      <motion.span
                        layoutId="underline"
                        className="absolute left-0 bottom-0 w-full h-[2px] bg-black rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </button>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>

      {/* FILTER LIMITED EDITION */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <button
          onClick={() => toggleSection("limited")}
          className="w-full flex justify-between items-center text-lg font-semibold text-gray-700 hover:text-black transition cursor-pointer"
        >
          <span>Limited Edition</span>
          <motion.span
            animate={{ rotate: openSections.limited ? 45 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {openSections.limited && (
            <motion.div
              key="limited-toggle"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-4 flex items-center justify-between"
            >
              <label
                htmlFor="limited-toggle"
                className="text-[18px] text-gray-600 cursor-pointer select-none"
              >
                Show Limited Only
              </label>
              <motion.input
                id="limited-toggle"
                type="checkbox"
                checked={limitedOnly}
                onChange={(e) => onLimitedChange(e.target.checked)}
                className="w-5 h-5 accent-black cursor-pointer"
                whileTap={{ scale: 0.9 }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
