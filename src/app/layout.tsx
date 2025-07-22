import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientToaster from "@/components/ui/client-toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Time Task Manager",
  description: "Multi-client time tracking and task management system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
      return (
      <html lang="en">
        <body className={inter.className}>
          {children}
          <ClientToaster />
        </body>
      </html>
    );
}
