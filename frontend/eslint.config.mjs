import nextVitals from "eslint-config-next/core-web-vitals";
import { globalIgnores } from "eslint/config";

const config = [
  ...nextVitals,
  globalIgnores(["_prototype/**", "node_modules/**", ".next/**"]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
