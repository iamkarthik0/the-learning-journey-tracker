import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/theme-provider";




// Local Inter font from public/webfonts (weights 100-700)
const inter = localFont({
  src: [
    {
      path: '/webfonts/inter-latin-100-normal.woff2',
      weight: '100',
      style: 'normal',
    },
    {
      path: '/webfonts/inter-latin-200-normal.woff2',
      weight: '200',
      style: 'normal',
    },
    {
      path: '/webfonts/inter-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '/webfonts/inter-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '/webfonts/inter-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '/webfonts/inter-latin-600-normal.woff2',
      weight: '600',
      style: 'normal',
    },
    {
      path: '/webfonts/inter-latin-700-normal.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "The Learning Journey Tracker",
  description: "Track your learning journey with style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full", "antialiased", "font-sans", inter.variable)}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('learning-journey-theme') || 'system';
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const effectiveTheme = theme === 'system' ? systemTheme : theme;
                if (effectiveTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          storageKey="learning-journey-theme"
        >
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
