import type { Metadata } from 'next';
import NavBar from './_components/NavBar';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Aditya Bhardwaj',
    template: '%s · Aditya Bhardwaj',
  },
  description: 'Personal site of Aditya Bhardwaj.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}
