"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Loader2, User, Ban, Filter, Eye, Lock, Unlock } from "lucide-react";
import { RoleGuard } from "@/components/auth/role-guard";
import { UserRoleEnum, UserStatusEnum, USER_ROLES, USER_STATUSES } from "@/models/user";
import { DataTable } from "@/components/books/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useUsers, useCreateManager, useUpdateUserStatus } from "@/lib/hooks/useUsers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/ui/form-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useUserStore } from "@/lib/store/useUserStore";

// Define validation schema for create manager form
const createManagerSchema = yup.object({
  name: yup.string().required("Name is required"),
  email: yup
    .string()
    .email("Please enter a valid email address")
    .required("Email is required"),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

type CreateManagerFormData = yup.InferType<typeof createManagerSchema>;

// Role badge styles
const roleBadgeStyles: Record<string, string> = {
  [UserRoleEnum.ADMIN]: "bg-red-100 text-red-700 hover:bg-red-100",
  [UserRoleEnum.MANAGER]: "bg-blue-100 text-blue-700 hover:bg-blue-100",
  [UserRoleEnum.MEMBER]: "bg-gray-100 text-gray-700 hover:bg-gray-100",
};

// Status badge styles
const statusBadgeStyles: Record<number, string> = {
  1: "bg-green-100 text-green-700 hover:bg-green-100", // ACTIVE
  2: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100", // INACTIVE
  3: "bg-red-100 text-red-700 hover:bg-red-100", // BANNED
};

// Status options
const statusOptions = [
  { value: UserStatusEnum.ACTIVE, label: "Active", id: 1 },
  { value: UserStatusEnum.INACTIVE, label: "Inactive", id: 2 },
  { value: UserStatusEnum.BANNED, label: "Banned", id: 3 },
];

// Role options
const roleOptions = [
  { value: UserRoleEnum.ALL, label: "All Roles", id: 0 },
  { value: UserRoleEnum.ADMIN, label: "Admin", id: 1 },
  { value: UserRoleEnum.MANAGER, label: "Manager", id: 2 },
  { value: UserRoleEnum.MEMBER, label: "Member", id: 3 },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>(UserRoleEnum.ALL);
  const [selectedStatus, setSelectedStatus] = useState<string>(UserStatusEnum.ACTIVE);
  const pageSize = 10;
  const { user } = useUserStore();

  // Debounce search query
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);

  // Get users query
  const {
    data: usersData,
    isLoading,
    error,
    refetch: refetchUsers,
  } = useUsers({
    page: currentPage,
    limit: pageSize,
    name: debouncedSearchQuery || undefined,
    role: selectedRole === UserRoleEnum.ALL ? undefined : USER_ROLES.find(role => role.name === selectedRole)?.id,
    status: selectedStatus === UserStatusEnum.ACTIVE ? undefined : USER_STATUSES.find(status => status.name === selectedStatus)?.id,
  });

  // Create manager mutation
  const { mutate: createManager, isPending: isCreating } = useCreateManager();

  // Update user status mutation
  const { mutate: updateUserStatus, isPending: isUpdatingStatus } = useUpdateUserStatus();

  // Form for creating manager
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateManagerFormData>({
    resolver: yupResolver(createManagerSchema),
  });

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleCreateManager = (data: CreateManagerFormData) => {

    createManager(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        reset();
        refetchUsers(); // Refresh the user list after creating a manager
      },
    });
  };

  const handleBlockUser = (userId: number) => {
    updateUserStatus({ userId, status: 3 }); // 3 is BANNED status
  };

  const handleUnbanUser = (userId: number) => {
    updateUserStatus({ userId, status: 1 }); // 1 is ACTIVE status
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Define columns for the data table
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted">
              {user.avatar && user.avatar.startsWith("http") ? (
                <Image
                  src={user.avatar}
                  alt={user.name}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/images/male.png";
                  }}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-muted">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <span className="font-medium">{user.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Badge
            variant="secondary"
            className={cn(roleBadgeStyles[user.role.name])}
          >
            {user.role.name}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        
        const user = row.original;
        console.log(user.status);
        const statusLabel = statusOptions.find(opt => opt.value === user.status?.name)?.label || "Unknown";
        return (
          <Badge
            variant="secondary"
            className={cn(statusBadgeStyles[user.status?.id])}
          >
            {statusLabel}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const rowUser = row.original;
        const isBlocked = rowUser.status?.name === UserStatusEnum.BANNED;
        const isAdmin = rowUser.role?.name === UserRoleEnum.ADMIN;
        const isManager = rowUser.role?.name === UserRoleEnum.MANAGER;

        // Only allow managers to ban members, admins can ban both managers and members
        const canBanUser = (user?.role?.name === UserRoleEnum.ADMIN && !isAdmin) || 
          (user?.role?.name === UserRoleEnum.MANAGER && !isAdmin && !isManager);

        // Only admins can unban managers, managers can only unban members
        const canUnbanUser = user?.role?.name === UserRoleEnum.ADMIN || 
          (user?.role?.name === UserRoleEnum.MANAGER && !isManager);

        return (
          <div className="flex justify-end gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      // TODO: Implement view details functionality
                      console.log("View details for user:", rowUser.id);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>View Details</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "h-8 w-8",
                      isBlocked && canUnbanUser ? "text-green-600 hover:text-green-700 hover:bg-green-50" : 
                      !canBanUser && !isBlocked ? "text-muted-foreground cursor-not-allowed" : 
                      "text-red-600 hover:text-red-700 hover:bg-red-50"
                    )}
                    onClick={() => isBlocked ? handleUnbanUser(rowUser.id) : handleBlockUser(rowUser.id)}
                    disabled={(!canBanUser && !isBlocked) || (!canUnbanUser && isBlocked) || isUpdatingStatus}
                  >
                    {isBlocked ? (
                      <Unlock className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {isBlocked 
                      ? !canUnbanUser 
                        ? "Insufficient permissions to unban" 
                        : "Unban User" 
                      : !canBanUser 
                        ? "Insufficient permissions" 
                        : "Block User"
                    }
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      },
    },
  ];

  return (
    <RoleGuard allowedRoles={[UserRoleEnum.ADMIN, UserRoleEnum.MANAGER]}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-muted-foreground mt-1">Manage user roles and permissions</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center" disabled={user?.role?.name !== UserRoleEnum.ADMIN || isCreating}>
                <Plus className="mr-2 h-4 w-4" />
                Add Manager
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Manager</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(handleCreateManager)} className="space-y-4">
                <FormInput
                  label="Name"
                  name="name"
                  register={register}
                  error={errors.name}
                  required
                  placeholder="Enter manager's name"
                />
                <FormInput
                  label="Email"
                  name="email"
                  type="email"
                  register={register}
                  error={errors.email}
                  required
                  placeholder="Enter manager's email"
                />
                <FormInput
                  label="Password"
                  name="password"
                  type="password"
                  register={register}
                  error={errors.password}
                  required
                  placeholder="Enter manager's password"
                />
                <Button type="submit" className="w-full" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Manager"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <Select
              value={selectedRole}
              onValueChange={(value) => {
                setSelectedRole(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value} disabled={role.value === UserRoleEnum.ADMIN && user?.role?.name !== UserRoleEnum.ADMIN}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search users..."
              className="pl-8 w-[250px] h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-destructive">
            Error loading users: {error.message}
          </div>
        )}

        <DataTable
          columns={columns}
          data={usersData?.data || []}
          pageSize={pageSize}
          pageCount={usersData?.totalPages || 1}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          manualPagination={true}
          hideSearchInput={true}
        />
      </div>
    </RoleGuard>
  );
} 