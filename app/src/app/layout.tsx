import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/WalletProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SolanaVote — On-chain Polling",
  description: "Decentralised voting powered by Solana",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <SolanaWalletProvider>{children}</SolanaWalletProvider>
      </body>
    </html>
  );
}
