"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, BarChart3, LogOut, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRoleEnum } from "@/models/user";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    {
      title: "Book Management",
      path: "/admin/books",
      icon: <BookOpenText className="h-5 w-5" />,
      roles: [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER],
    },
    {
      title: "Analytics",
      path: "/admin/analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      roles: [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER],
    },
    {
      title: "User Management",
      path: "/admin/users",
      icon: <Users className="h-5 w-5" />,
      roles: [UserRoleEnum.ADMIN],
    },
  ];

  return (
    <RoleGuard allowedRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
      {/* Admin-specific header */}
      <header className="bg-card dark:bg-gray-900 border-b border-border dark:border-gray-700 h-14 flex items-center px-4 shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSidebar}
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              className="cursor-pointer dark:text-white dark:hover:bg-gray-800"
            >
              {isSidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </Button>

            <Link href="/">
              <h1 className="text-xl font-bold dark:text-white text-yellow-600 dark:text-yellow-400">Haru's Library Admin</h1>
            </Link>
          </div>
          <Link href="/">
            <Button variant="ghost" className="flex items-center cursor-pointer dark:text-white dark:hover:bg-gray-800">
              <LogOut className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-card dark:bg-gray-900 border-r border-border dark:border-gray-700 transition-all duration-300 ease-in-out flex flex-col",
            isSidebarOpen ? "w-64" : "w-16"
          )}
        >
          <nav className={cn("flex-1", isSidebarOpen ? "p-4 space-y-2" : "p-2 space-y-2")}>
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                title={!isSidebarOpen ? item.title : undefined}
                className={cn(
                  "flex items-center rounded-md transition-colors cursor-pointer",
                  isSidebarOpen ? "px-4 py-3" : "p-2 justify-center",
                  pathname === item.path || pathname.startsWith(`${item.path}/`)
                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                    : "text-foreground dark:text-gray-300 hover:bg-secondary dark:hover:bg-gray-800"
                )}
              >
                <div className={isSidebarOpen ? "mr-2" : ""}>
                  {item.icon}
                </div>
                {isSidebarOpen && <span>{item.title}</span>}
              </Link>
            ))}
          </nav>
          {isSidebarOpen && (
            <div className="p-4 border-t border-border dark:border-gray-700">
              <div className="text-sm text-muted-foreground dark:text-gray-400">
                <div>Admin Portal</div>
                <div>Version 1.0.0</div>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto p-6 transition-all duration-300 ease-in-out dark:bg-gray-900">
          {children}
        </main>
      </div>
    </RoleGuard>
  );
} 