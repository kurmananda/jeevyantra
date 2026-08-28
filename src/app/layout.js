import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Led from "@/components/Led";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata = {
  title: "Jeevyantra — Robotics Club",
  description: "Home of Jeevyantra: projects, members, and the club inventory.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>
        <footer className="flex items-center justify-center gap-2 border-t-2 border-border py-6 text-center text-xs font-semibold text-muted">
          <Led on pulse size={7} />
          Jeevyantra Robotics Club — built by members, for members.
        </footer>
      </body>
    </html>
  );
}
