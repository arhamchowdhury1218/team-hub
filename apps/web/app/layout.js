import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Team Hub",
  description: "Collaborate with your team in real time",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        {/* AuthProvider checks if the user is logged in when the app first loads */}
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
