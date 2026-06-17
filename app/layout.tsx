import { Metadata } from 'next';
import { Toaster } from '@/components/ui/Toasts/toaster';
import { PropsWithChildren, Suspense } from 'react';
import { getURL } from '@/utils/helpers';
import 'styles/main.css';

const title = 'Semper Validus — Always Strong';
const description =
  'Elite performance training for those who hold themselves to a higher standard. Transform your foundation. Forge your legacy.';

export const metadata: Metadata = {
  metadataBase: new URL(getURL()),
  title,
  description,
  openGraph: {
    title,
    description
  }
};

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <body className="bg-sv-navy text-white antialiased">
        <main id="skip" className="min-h-screen">
          {children}
        </main>
        <Suspense>
          <Toaster />
        </Suspense>
      </body>
    </html>
  );
}
