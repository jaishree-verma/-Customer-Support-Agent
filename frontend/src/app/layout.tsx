import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RAG Assistant Network | Enterprise AI Support Portal",
  description: "Self-Correcting RAG Multi-Agent Customer Support Network powered by LangGraph, ChromaDB, and Google Gemini.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
