"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
} 