"use client";

import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import AnalyticsPageWrapper from "@/components/providers/AnalyticsPageWrapper";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsPageWrapper>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </AnalyticsPageWrapper>
    </>
  );
} 