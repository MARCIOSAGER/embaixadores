import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const COUNTRIES = [
  // Primeiros: Brasil + pa\u00edses lus\u00f3fonos e principais destinos de Embaixadores
  { code: "BR", name: "Brasil", dial: "+55", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "\u{1F1F5}\u{1F1F9}" },
  { code: "AO", name: "Angola", dial: "+244", flag: "\u{1F1E6}\u{1F1F4}" },
  { code: "MZ", name: "Mo\u00e7ambique", dial: "+258", flag: "\u{1F1F2}\u{1F1FF}" },
  { code: "CV", name: "Cabo Verde", dial: "+238", flag: "\u{1F1E8}\u{1F1FB}" },
  { code: "GW", name: "Guin\u00e9-Bissau", dial: "+245", flag: "\u{1F1EC}\u{1F1FC}" },
  { code: "ST", name: "S\u00e3o Tom\u00e9 e Pr\u00edncipe", dial: "+239", flag: "\u{1F1F8}\u{1F1F9}" },
  { code: "TL", name: "Timor-Leste", dial: "+670", flag: "\u{1F1F9}\u{1F1F1}" },
  { code: "GQ", name: "Guin\u00e9 Equatorial", dial: "+240", flag: "\u{1F1EC}\u{1F1F6}" },
  { code: "MO", name: "Macau", dial: "+853", flag: "\u{1F1F2}\u{1F1F4}" },
  { code: "US", name: "Estados Unidos", dial: "+1", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "ES", name: "Espanha", dial: "+34", flag: "\u{1F1EA}\u{1F1F8}" },
  { code: "GB", name: "Reino Unido", dial: "+44", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "AE", name: "Emirados \u00c1rabes Unidos", dial: "+971", flag: "\u{1F1E6}\u{1F1EA}" },
  { code: "JP", name: "Jap\u00e3o", dial: "+81", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "IT", name: "It\u00e1lia", dial: "+39", flag: "\u{1F1EE}\u{1F1F9}" },

  // Am\u00e9rica Latina e Caribe
  { code: "AR", name: "Argentina", dial: "+54", flag: "\u{1F1E6}\u{1F1F7}" },
  { code: "BO", name: "Bol\u00edvia", dial: "+591", flag: "\u{1F1E7}\u{1F1F4}" },
  { code: "CL", name: "Chile", dial: "+56", flag: "\u{1F1E8}\u{1F1F1}" },
  { code: "CO", name: "Col\u00f4mbia", dial: "+57", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "CR", name: "Costa Rica", dial: "+506", flag: "\u{1F1E8}\u{1F1F7}" },
  { code: "CU", name: "Cuba", dial: "+53", flag: "\u{1F1E8}\u{1F1FA}" },
  { code: "DO", name: "Rep\u00fablica Dominicana", dial: "+1809", flag: "\u{1F1E9}\u{1F1F4}" },
  { code: "EC", name: "Equador", dial: "+593", flag: "\u{1F1EA}\u{1F1E8}" },
  { code: "SV", name: "El Salvador", dial: "+503", flag: "\u{1F1F8}\u{1F1FB}" },
  { code: "GT", name: "Guatemala", dial: "+502", flag: "\u{1F1EC}\u{1F1F9}" },
  { code: "HT", name: "Haiti", dial: "+509", flag: "\u{1F1ED}\u{1F1F9}" },
  { code: "HN", name: "Honduras", dial: "+504", flag: "\u{1F1ED}\u{1F1F3}" },
  { code: "JM", name: "Jamaica", dial: "+1876", flag: "\u{1F1EF}\u{1F1F2}" },
  { code: "MX", name: "M\u00e9xico", dial: "+52", flag: "\u{1F1F2}\u{1F1FD}" },
  { code: "NI", name: "Nicar\u00e1gua", dial: "+505", flag: "\u{1F1F3}\u{1F1EE}" },
  { code: "PA", name: "Panam\u00e1", dial: "+507", flag: "\u{1F1F5}\u{1F1E6}" },
  { code: "PY", name: "Paraguai", dial: "+595", flag: "\u{1F1F5}\u{1F1FE}" },
  { code: "PE", name: "Peru", dial: "+51", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "PR", name: "Porto Rico", dial: "+1787", flag: "\u{1F1F5}\u{1F1F7}" },
  { code: "UY", name: "Uruguai", dial: "+598", flag: "\u{1F1FA}\u{1F1FE}" },
  { code: "VE", name: "Venezuela", dial: "+58", flag: "\u{1F1FB}\u{1F1EA}" },

  // Am\u00e9rica do Norte
  { code: "CA", name: "Canad\u00e1", dial: "+1", flag: "\u{1F1E8}\u{1F1E6}" },

  // Europa
  { code: "AL", name: "Alb\u00e2nia", dial: "+355", flag: "\u{1F1E6}\u{1F1F1}" },
  { code: "DE", name: "Alemanha", dial: "+49", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "AD", name: "Andorra", dial: "+376", flag: "\u{1F1E6}\u{1F1E9}" },
  { code: "AT", name: "\u00c1ustria", dial: "+43", flag: "\u{1F1E6}\u{1F1F9}" },
  { code: "BE", name: "B\u00e9lgica", dial: "+32", flag: "\u{1F1E7}\u{1F1EA}" },
  { code: "BY", name: "Bielorr\u00fassia", dial: "+375", flag: "\u{1F1E7}\u{1F1FE}" },
  { code: "BA", name: "B\u00f3snia e Herzegovina", dial: "+387", flag: "\u{1F1E7}\u{1F1E6}" },
  { code: "BG", name: "Bulg\u00e1ria", dial: "+359", flag: "\u{1F1E7}\u{1F1EC}" },
  { code: "HR", name: "Cro\u00e1cia", dial: "+385", flag: "\u{1F1ED}\u{1F1F7}" },
  { code: "DK", name: "Dinamarca", dial: "+45", flag: "\u{1F1E9}\u{1F1F0}" },
  { code: "SK", name: "Eslov\u00e1quia", dial: "+421", flag: "\u{1F1F8}\u{1F1F0}" },
  { code: "SI", name: "Eslov\u00eania", dial: "+386", flag: "\u{1F1F8}\u{1F1EE}" },
  { code: "EE", name: "Est\u00f4nia", dial: "+372", flag: "\u{1F1EA}\u{1F1EA}" },
  { code: "FI", name: "Finl\u00e2ndia", dial: "+358", flag: "\u{1F1EB}\u{1F1EE}" },
  { code: "FR", name: "Fran\u00e7a", dial: "+33", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "GR", name: "Gr\u00e9cia", dial: "+30", flag: "\u{1F1EC}\u{1F1F7}" },
  { code: "HU", name: "Hungria", dial: "+36", flag: "\u{1F1ED}\u{1F1FA}" },
  { code: "IE", name: "Irlanda", dial: "+353", flag: "\u{1F1EE}\u{1F1EA}" },
  { code: "IS", name: "Isl\u00e2ndia", dial: "+354", flag: "\u{1F1EE}\u{1F1F8}" },
  { code: "LV", name: "Let\u00f4nia", dial: "+371", flag: "\u{1F1F1}\u{1F1FB}" },
  { code: "LI", name: "Liechtenstein", dial: "+423", flag: "\u{1F1F1}\u{1F1EE}" },
  { code: "LT", name: "Litu\u00e2nia", dial: "+370", flag: "\u{1F1F1}\u{1F1F9}" },
  { code: "LU", name: "Luxemburgo", dial: "+352", flag: "\u{1F1F1}\u{1F1FA}" },
  { code: "MK", name: "Maced\u00f4nia do Norte", dial: "+389", flag: "\u{1F1F2}\u{1F1F0}" },
  { code: "MT", name: "Malta", dial: "+356", flag: "\u{1F1F2}\u{1F1F9}" },
  { code: "MD", name: "Mold\u00e1via", dial: "+373", flag: "\u{1F1F2}\u{1F1E9}" },
  { code: "MC", name: "M\u00f4naco", dial: "+377", flag: "\u{1F1F2}\u{1F1E8}" },
  { code: "ME", name: "Montenegro", dial: "+382", flag: "\u{1F1F2}\u{1F1EA}" },
  { code: "NO", name: "Noruega", dial: "+47", flag: "\u{1F1F3}\u{1F1F4}" },
  { code: "NL", name: "Pa\u00edses Baixos", dial: "+31", flag: "\u{1F1F3}\u{1F1F1}" },
  { code: "PL", name: "Pol\u00f4nia", dial: "+48", flag: "\u{1F1F5}\u{1F1F1}" },
  { code: "CZ", name: "Rep\u00fablica Tcheca", dial: "+420", flag: "\u{1F1E8}\u{1F1FF}" },
  { code: "RO", name: "Rom\u00eania", dial: "+40", flag: "\u{1F1F7}\u{1F1F4}" },
  { code: "RU", name: "R\u00fassia", dial: "+7", flag: "\u{1F1F7}\u{1F1FA}" },
  { code: "SM", name: "San Marino", dial: "+378", flag: "\u{1F1F8}\u{1F1F2}" },
  { code: "RS", name: "S\u00e9rvia", dial: "+381", flag: "\u{1F1F7}\u{1F1F8}" },
  { code: "SE", name: "Su\u00e9cia", dial: "+46", flag: "\u{1F1F8}\u{1F1EA}" },
  { code: "CH", name: "Su\u00ed\u00e7a", dial: "+41", flag: "\u{1F1E8}\u{1F1ED}" },
  { code: "UA", name: "Ucr\u00e2nia", dial: "+380", flag: "\u{1F1FA}\u{1F1E6}" },
  { code: "VA", name: "Vaticano", dial: "+379", flag: "\u{1F1FB}\u{1F1E6}" },

  // \u00c1frica
  { code: "DZ", name: "Arg\u00e9lia", dial: "+213", flag: "\u{1F1E9}\u{1F1FF}" },
  { code: "BJ", name: "Benin", dial: "+229", flag: "\u{1F1E7}\u{1F1EF}" },
  { code: "BW", name: "Botsuana", dial: "+267", flag: "\u{1F1E7}\u{1F1FC}" },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "\u{1F1E7}\u{1F1EB}" },
  { code: "BI", name: "Burundi", dial: "+257", flag: "\u{1F1E7}\u{1F1EE}" },
  { code: "CM", name: "Camar\u00f5es", dial: "+237", flag: "\u{1F1E8}\u{1F1F2}" },
  { code: "TD", name: "Chade", dial: "+235", flag: "\u{1F1F9}\u{1F1E9}" },
  { code: "KM", name: "Comores", dial: "+269", flag: "\u{1F1F0}\u{1F1F2}" },
  { code: "CG", name: "Congo", dial: "+242", flag: "\u{1F1E8}\u{1F1EC}" },
  { code: "CD", name: "Congo (RDC)", dial: "+243", flag: "\u{1F1E8}\u{1F1E9}" },
  { code: "CI", name: "Costa do Marfim", dial: "+225", flag: "\u{1F1E8}\u{1F1EE}" },
  { code: "DJ", name: "Djibuti", dial: "+253", flag: "\u{1F1E9}\u{1F1EF}" },
  { code: "EG", name: "Egito", dial: "+20", flag: "\u{1F1EA}\u{1F1EC}" },
  { code: "ER", name: "Eritreia", dial: "+291", flag: "\u{1F1EA}\u{1F1F7}" },
  { code: "SZ", name: "Essuatini", dial: "+268", flag: "\u{1F1F8}\u{1F1FF}" },
  { code: "ET", name: "Eti\u00f3pia", dial: "+251", flag: "\u{1F1EA}\u{1F1F9}" },
  { code: "GA", name: "Gab\u00e3o", dial: "+241", flag: "\u{1F1EC}\u{1F1E6}" },
  { code: "GM", name: "G\u00e2mbia", dial: "+220", flag: "\u{1F1EC}\u{1F1F2}" },
  { code: "GH", name: "Gana", dial: "+233", flag: "\u{1F1EC}\u{1F1ED}" },
  { code: "GN", name: "Guin\u00e9", dial: "+224", flag: "\u{1F1EC}\u{1F1F3}" },
  { code: "KE", name: "Qu\u00eania", dial: "+254", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "LS", name: "Lesoto", dial: "+266", flag: "\u{1F1F1}\u{1F1F8}" },
  { code: "LR", name: "Lib\u00e9ria", dial: "+231", flag: "\u{1F1F1}\u{1F1F7}" },
  { code: "LY", name: "L\u00edbia", dial: "+218", flag: "\u{1F1F1}\u{1F1FE}" },
  { code: "MG", name: "Madagascar", dial: "+261", flag: "\u{1F1F2}\u{1F1EC}" },
  { code: "MW", name: "Malawi", dial: "+265", flag: "\u{1F1F2}\u{1F1FC}" },
  { code: "ML", name: "Mali", dial: "+223", flag: "\u{1F1F2}\u{1F1F1}" },
  { code: "MA", name: "Marrocos", dial: "+212", flag: "\u{1F1F2}\u{1F1E6}" },
  { code: "MU", name: "Maur\u00edcio", dial: "+230", flag: "\u{1F1F2}\u{1F1FA}" },
  { code: "MR", name: "Maurit\u00e2nia", dial: "+222", flag: "\u{1F1F2}\u{1F1F7}" },
  { code: "NA", name: "Nam\u00edbia", dial: "+264", flag: "\u{1F1F3}\u{1F1E6}" },
  { code: "NE", name: "N\u00edger", dial: "+227", flag: "\u{1F1F3}\u{1F1EA}" },
  { code: "NG", name: "Nig\u00e9ria", dial: "+234", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "CF", name: "Rep. Centro-Africana", dial: "+236", flag: "\u{1F1E8}\u{1F1EB}" },
  { code: "RW", name: "Ruanda", dial: "+250", flag: "\u{1F1F7}\u{1F1FC}" },
  { code: "SN", name: "Senegal", dial: "+221", flag: "\u{1F1F8}\u{1F1F3}" },
  { code: "SL", name: "Serra Leoa", dial: "+232", flag: "\u{1F1F8}\u{1F1F1}" },
  { code: "SC", name: "Seicheles", dial: "+248", flag: "\u{1F1F8}\u{1F1E8}" },
  { code: "SO", name: "Som\u00e1lia", dial: "+252", flag: "\u{1F1F8}\u{1F1F4}" },
  { code: "SD", name: "Sud\u00e3o", dial: "+249", flag: "\u{1F1F8}\u{1F1E9}" },
  { code: "SS", name: "Sud\u00e3o do Sul", dial: "+211", flag: "\u{1F1F8}\u{1F1F8}" },
  { code: "TZ", name: "Tanz\u00e2nia", dial: "+255", flag: "\u{1F1F9}\u{1F1FF}" },
  { code: "TG", name: "Togo", dial: "+228", flag: "\u{1F1F9}\u{1F1EC}" },
  { code: "TN", name: "Tun\u00edsia", dial: "+216", flag: "\u{1F1F9}\u{1F1F3}" },
  { code: "UG", name: "Uganda", dial: "+256", flag: "\u{1F1FA}\u{1F1EC}" },
  { code: "ZA", name: "\u00c1frica do Sul", dial: "+27", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "ZM", name: "Z\u00e2mbia", dial: "+260", flag: "\u{1F1FF}\u{1F1F2}" },
  { code: "ZW", name: "Zimb\u00e1bue", dial: "+263", flag: "\u{1F1FF}\u{1F1FC}" },

  // Oriente M\u00e9dio
  { code: "SA", name: "Ar\u00e1bia Saudita", dial: "+966", flag: "\u{1F1F8}\u{1F1E6}" },
  { code: "BH", name: "Bahrein", dial: "+973", flag: "\u{1F1E7}\u{1F1ED}" },
  { code: "QA", name: "Catar", dial: "+974", flag: "\u{1F1F6}\u{1F1E6}" },
  { code: "IR", name: "Ir\u00e3", dial: "+98", flag: "\u{1F1EE}\u{1F1F7}" },
  { code: "IQ", name: "Iraque", dial: "+964", flag: "\u{1F1EE}\u{1F1F6}" },
  { code: "IL", name: "Israel", dial: "+972", flag: "\u{1F1EE}\u{1F1F1}" },
  { code: "JO", name: "Jord\u00e2nia", dial: "+962", flag: "\u{1F1EF}\u{1F1F4}" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "\u{1F1F0}\u{1F1FC}" },
  { code: "LB", name: "L\u00edbano", dial: "+961", flag: "\u{1F1F1}\u{1F1E7}" },
  { code: "OM", name: "Om\u00e3", dial: "+968", flag: "\u{1F1F4}\u{1F1F2}" },
  { code: "PS", name: "Palestina", dial: "+970", flag: "\u{1F1F5}\u{1F1F8}" },
  { code: "SY", name: "S\u00edria", dial: "+963", flag: "\u{1F1F8}\u{1F1FE}" },
  { code: "TR", name: "Turquia", dial: "+90", flag: "\u{1F1F9}\u{1F1F7}" },
  { code: "YE", name: "I\u00eamen", dial: "+967", flag: "\u{1F1FE}\u{1F1EA}" },

  // \u00c1sia
  { code: "AF", name: "Afeganist\u00e3o", dial: "+93", flag: "\u{1F1E6}\u{1F1EB}" },
  { code: "AM", name: "Arm\u00eania", dial: "+374", flag: "\u{1F1E6}\u{1F1F2}" },
  { code: "AZ", name: "Azerbaij\u00e3o", dial: "+994", flag: "\u{1F1E6}\u{1F1FF}" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "BT", name: "But\u00e3o", dial: "+975", flag: "\u{1F1E7}\u{1F1F9}" },
  { code: "BN", name: "Brunei", dial: "+673", flag: "\u{1F1E7}\u{1F1F3}" },
  { code: "KH", name: "Camboja", dial: "+855", flag: "\u{1F1F0}\u{1F1ED}" },
  { code: "KZ", name: "Cazaquist\u00e3o", dial: "+77", flag: "\u{1F1F0}\u{1F1FF}" },
  { code: "CN", name: "China", dial: "+86", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "CY", name: "Chipre", dial: "+357", flag: "\u{1F1E8}\u{1F1FE}" },
  { code: "KR", name: "Coreia do Sul", dial: "+82", flag: "\u{1F1F0}\u{1F1F7}" },
  { code: "KP", name: "Coreia do Norte", dial: "+850", flag: "\u{1F1F0}\u{1F1F5}" },
  { code: "PH", name: "Filipinas", dial: "+63", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "GE", name: "Ge\u00f3rgia", dial: "+995", flag: "\u{1F1EC}\u{1F1EA}" },
  { code: "HK", name: "Hong Kong", dial: "+852", flag: "\u{1F1ED}\u{1F1F0}" },
  { code: "IN", name: "\u00cdndia", dial: "+91", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "ID", name: "Indon\u00e9sia", dial: "+62", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "KG", name: "Quirguist\u00e3o", dial: "+996", flag: "\u{1F1F0}\u{1F1EC}" },
  { code: "LA", name: "Laos", dial: "+856", flag: "\u{1F1F1}\u{1F1E6}" },
  { code: "MY", name: "Mal\u00e1sia", dial: "+60", flag: "\u{1F1F2}\u{1F1FE}" },
  { code: "MV", name: "Maldivas", dial: "+960", flag: "\u{1F1F2}\u{1F1FB}" },
  { code: "MN", name: "Mong\u00f3lia", dial: "+976", flag: "\u{1F1F2}\u{1F1F3}" },
  { code: "MM", name: "Mianmar", dial: "+95", flag: "\u{1F1F2}\u{1F1F2}" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "\u{1F1F3}\u{1F1F5}" },
  { code: "PK", name: "Paquist\u00e3o", dial: "+92", flag: "\u{1F1F5}\u{1F1F0}" },
  { code: "SG", name: "Singapura", dial: "+65", flag: "\u{1F1F8}\u{1F1EC}" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "TW", name: "Taiwan", dial: "+886", flag: "\u{1F1F9}\u{1F1FC}" },
  { code: "TJ", name: "Tadjiquist\u00e3o", dial: "+992", flag: "\u{1F1F9}\u{1F1EF}" },
  { code: "TH", name: "Tail\u00e2ndia", dial: "+66", flag: "\u{1F1F9}\u{1F1ED}" },
  { code: "TM", name: "Turcomenist\u00e3o", dial: "+993", flag: "\u{1F1F9}\u{1F1F2}" },
  { code: "UZ", name: "Uzbequist\u00e3o", dial: "+998", flag: "\u{1F1FA}\u{1F1FF}" },
  { code: "VN", name: "Vietn\u00e3", dial: "+84", flag: "\u{1F1FB}\u{1F1F3}" },

  // Oceania
  { code: "AU", name: "Austr\u00e1lia", dial: "+61", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "FJ", name: "Fiji", dial: "+679", flag: "\u{1F1EB}\u{1F1EF}" },
  { code: "NZ", name: "Nova Zel\u00e2ndia", dial: "+64", flag: "\u{1F1F3}\u{1F1FF}" },
  { code: "PG", name: "Papua-Nova Guin\u00e9", dial: "+675", flag: "\u{1F1F5}\u{1F1EC}" },
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
