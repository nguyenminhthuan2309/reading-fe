import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/useUserStore';
import { UserRoleEnum } from '@/models/user';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: UserRoleEnum[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { user } = useUserStore();

  // If user is not logged in or doesn't have the required role, redirect to home
  if (!user || !allowedRoles.includes(user.role.name as UserRoleEnum)) {
    router.push('/');
    return null;
  }

  return <>{children}</>;
} 