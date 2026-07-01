import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { getSiteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HomeLink — finn ditt folk i et nytt land",
    template: "%s · HomeLink",
  },
  description:
    "HomeLink kobler deg til folk fra hjemlandet ditt og naboer i byen du bor i. Bli med i samtaler, still spørsmål og møt folk.",
  openGraph: {
    type: "website",
    locale: "nb_NO",
    siteName: "HomeLink",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nb-NO" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{ className: "rounded-xl" }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
