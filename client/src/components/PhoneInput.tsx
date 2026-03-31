import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const COUNTRIES = [
  { code: "BR", name: "Brasil", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "US", name: "United States", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "ES", name: "Espa\u00f1a", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "CL", name: "Chile", dial: "+56", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "MX", name: "M\u00e9xico", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "PY", name: "Paraguay", dial: "+595", flag: "\u{1F1F5}\u{1F1FE}" },
  { code: "UY", name: "Uruguay", dial: "+598", flag: "\u{1F1FA}\u{1F1FE}" },
  { code: "PE", name: "Per\u00fa", dial: "+51", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "BO", name: "Bolivia", dial: "+591", flag: "\u{1F1E7}\u{1F1F4}" },
  { code: "EC", name: "Ecuador", dial: "+593", flag: "\u{1F1EA}\u{1F1E8}" },
  { code: "VE", name: "Venezuela", dial: "+58", flag: "\u{1F1FB}\u{1F1EA}" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "FR", name: "France", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "DE", name: "Germany", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "IT", name: "Italy", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },
  { code: "JP", name: "Japan", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "CA", name: "Canada", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },
  { code: "AU", name: "Australia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "IL", name: "Israel", dial: "+972", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "IN", name: "India", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "AE", name: "UAE", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
];

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
  /** "underline" for the Inscricao typeform style, default is "apple" */
  variant?: "apple" | "underline";
};

function parseCountryFromValue(value: string) {
  if (value && value.startsWith("+")) {
    // Sort by dial length descending to match longest first (e.g. +595 before +5)
    const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
    const match = sorted.find((c) => value.startsWith(c.dial));
    if (match) {
      return { country: match, number: value.slice(match.dial.length).trim() };
    }
  }
  return null;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder,
  className,
  required,
  variant = "apple",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState(COUNTRIES[0]); // Brazil default
  const [number, setNumber] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Parse initial value to extract country code (only on mount)
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (value) {
      const parsed = parseCountryFromValue(value);
      if (parsed) {
        setCountry(parsed.country);
        setNumber(parsed.number);
      } else {
        setNumber(value);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Emit combined value when country or number changes
  const countryRef = useRef(country);
  const numberRef = useRef(number);

  useEffect(() => {
    // Skip the initial render effect
    if (!initializedRef.current) return;
    const prevCountry = countryRef.current;
    const prevNumber = numberRef.current;
    countryRef.current = country;
    numberRef.current = number;

    // Only emit if something actually changed from user interaction
    if (prevCountry === country && prevNumber === number) return;

    const full = number ? `${country.dial} ${number}` : "";
    onChange(full);
  }, [country, number]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase()),
      )
    : COUNTRIES;

  const isUnderline = variant === "underline";

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <div
        className={
          isUnderline
            ? "flex items-stretch border-b-2 border-white/20 focus-within:border-[#FF6B00] transition-colors duration-300"
            : "flex items-stretch bg-[rgba(118,118,128,0.12)] border border-transparent rounded-xl focus-within:border-[#FF6B00] focus-within:bg-[rgba(118,118,128,0.18)] focus-within:shadow-[0_0_0_3px_rgba(255,107,0,0.2)] transition-all"
        }
      >
        {/* Country selector */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors cursor-pointer shrink-0 ${
            isUnderline ? "pr-3" : "px-3 border-r border-white/10"
          }`}
        >
          <span className="text-lg">{country.flag}</span>
          <span className="text-xs font-medium">{country.dial}</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {/* Number input */}
        <input
          type="tel"
          inputMode="tel"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder={placeholder || "(11) 99999-9999"}
          required={required}
          className={
            isUnderline
              ? "flex-1 bg-transparent px-2 py-4 text-[16px] sm:text-2xl text-white placeholder:text-white/25 focus:outline-none caret-[#FF6B00]"
              : "flex-1 bg-transparent px-3 py-3 text-[16px] text-white placeholder:text-white/30 focus:outline-none"
          }
        />
      </div>
      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1c1c1e] border border-white/10 rounded-xl shadow-2xl max-h-64 overflow-hidden">
          <div className="p-2 border-b border-white/5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar pa\u00eds..."
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCountry(c);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer
                  ${
                    country.code === c.code
                      ? "bg-[#FF6B00]/15 text-[#FF6B00]"
                      : "text-white/80 hover:bg-white/5"
                  }`}
              >
                <span className="text-lg">{c.flag}</span>
                <span className="flex-1 text-left">{c.name}</span>
                <span className="text-xs text-white/40">{c.dial}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
