import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { isAuthConfigured } from "@/app/lib/auth-config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gorilla Mentality",
  description: "Free Gorilla Mentality membership, adaptive workouts, meal tracking, progress records, and personal coaching.",
  icons: { icon: "/brand.png", apple: "/brand.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authEnabled = isAuthConfigured();
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {authEnabled ? (
          <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: "#eab308",
                colorPrimaryForeground: "#09090b",
                colorBackground: "#18181b",
                colorForeground: "#fafafa",
                colorMutedForeground: "#a1a1aa",
                colorNeutral: "#fafafa",
                borderRadius: "0.5rem",
              },
              options: {
                unsafe_disableDevelopmentModeWarnings: true,
                logoImageUrl: "/brand.png",
                logoLinkUrl: "/",
              },
              elements: {
                formButtonPrimary: { color: "#09090b" },
                formFieldInput: {
                  backgroundColor: "#09090b",
                  color: "#fafafa",
                },
              },
            }}
            signInUrl="/login"
            signUpUrl="/signup"
            signInFallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
          >
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
