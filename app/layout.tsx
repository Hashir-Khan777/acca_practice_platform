import type { Metadata } from "next";
import "./globals.css"; // Global styles

export const metadata: Metadata = {
  title: "Accountly AI Practice Platform",
  description:
    "Practice CA, ACCA, ICMA, and professional syllabus concepts with Accountly AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('acca_theme') || 'light';
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen flex flex-col antialiased"
      >
        {children}
      </body>
    </html>
  );
}
