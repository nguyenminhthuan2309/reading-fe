"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, BarChart3, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    {
      title: "Book Management",
      path: "/admin/books",
      icon: <BookOpenText className="mr-2 h-5 w-5" />,
    },
    {
      title: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart3 className="mr-2 h-5 w-5" />,
    },
  ];

  return (
    <>
      {/* Admin-specific header */}
      <header className="bg-card border-b border-border h-14 flex items-center px-4 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="cursor-pointer"
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-bold">Haru's Library Admin</h1>
          </div>
          <Link href="/">
            <Button variant="ghost" className="flex items-center cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Exit Admin
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-card border-r border-border w-64 transition-all duration-300 ease-in-out flex flex-col",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4 space-y-2 flex-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center px-4 py-3 rounded-md transition-colors cursor-pointer",
                  pathname === item.path || pathname.startsWith(`${item.path}/`)
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                )}
              >
                {item.icon}
                <span>{item.title}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              <div>Admin Portal</div>
              <div>Version 1.0.0</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-auto p-6 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "ml-0" : "ml-0 md:ml-0"
        )}>
          {children}
        </main>
      </div>
    </>
  );
} 