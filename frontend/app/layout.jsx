import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});
export const metadata = {
  title: { default: "SSV · For a healthy life", template: "%s · SSV" },
  description: "Pure, natural and chemical-free products for a healthy life.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/brand/ssv-07-favicon-app-icon.svg",
  },
};
export const dynamic = "force-dynamic";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${display.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
