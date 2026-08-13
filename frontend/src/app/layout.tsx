import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MiniMax Image Studio",
  description: "Generate images with MiniMax image-01",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
