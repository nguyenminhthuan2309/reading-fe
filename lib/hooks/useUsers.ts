import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, createManager, updateUserStatus, GetUsersParams as ApiGetUsersParams } from '@/lib/api/user';
import { toast } from 'sonner';
import { USER_KEYS } from '@/lib/constants/query-keys';

interface GetUsersParams {
  page: number;
  limit: number;
  name?: string;
  role?: number;
  status?: number;
}

export function useUsers(params: GetUsersParams) {
  return useQuery({
    queryKey: [USER_KEYS.LIST(params)],
    queryFn: async () => {
      const response = await getUsers(params as ApiGetUsersParams);
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to fetch users');
      }
      return response.data;
    },
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await createManager(data);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error(response.msg || 'Failed to create manager');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('Manager created successfully');
      queryClient.invalidateQueries({ queryKey: [USER_KEYS.ALL] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create manager');
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, status }: { userId: number; status: number }) => {
      const response = await updateUserStatus(userId, status);
      if (response.status !== 200) {
        throw new Error(response.msg || 'Failed to update user status');
      }
      return response.data;
    },
    onSuccess: () => {
      toast.success('User status updated successfully');
      queryClient.invalidateQueries({ queryKey: [USER_KEYS.ALL] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user status');
    },
  });
} 