import type { Metadata } from "next";
import "./globals.css";
import ClientLayoutWrapper from "../components/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "DevPrep AI — AI-Powered Placement OS",
  description: "AI-powered placement preparation platform for engineering students to master DSA, optimize resumes, run mock voice interviews, and review concepts with RAG tutoring.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full bg-[#0b0717] antialiased">
        <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
      </body>
    </html>
  );
}
