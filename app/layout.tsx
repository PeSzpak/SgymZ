import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Fredoka, Nunito } from "next/font/google";
import { ThemeProvider } from "@/hooks/use-theme";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const barlow = Barlow({ variable: "--font-barlow", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["500", "600", "700"] });
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], weight: ["400", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SGYMZ",
  description: "Seus treinos, suas séries, seu progresso.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SGYMZ", statusBarStyle: "black-translucent" },
  icons: { icon: "/hellokitty-logo.png", apple: "/hellokitty-logo.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0f12",
};

// Aplica o tema salvo antes da primeira pintura (evita o "flash" de tema errado)
const themeScript = `try{var t=localStorage.getItem("preferred-theme");if(t==="hellokitty"){document.documentElement.setAttribute("data-theme","hellokitty")}}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${barlow.variable} ${barlowCondensed.variable} ${fredoka.variable} ${nunito.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
