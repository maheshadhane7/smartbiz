import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';
import { NotificationProvider } from '../context/NotificationContext';

export const metadata: Metadata = {
  title: 'Prasana Enterprises - Smart ERP & Billing System',
  description: 'Prasana Enterprises Intelligent Business Platform - Smart POS Billing, Inventory ERP, CRM, GST Compliance, and AI Automations.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black text-white min-h-screen antialiased">
        <AuthProvider>
          <DataProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
