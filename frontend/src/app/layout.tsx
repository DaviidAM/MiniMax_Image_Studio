import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniMax Image Studio",
  description: "Generate stunning images with MiniMax image-01 AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%236366f1'/><text x='50%' y='50%' dominant-baseline='central' text-anchor='middle' font-size='18' fill='white'>M</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
