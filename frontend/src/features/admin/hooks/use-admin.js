import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../../api/axiosClient';

// --- Roles ---
export const useRoles = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'roles', params],
    queryFn: async () => {
      const response = await axiosClient.get('/admin/roles', { params });
      return response.data;
    }
  });
};

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: async () => {
      const response = await axiosClient.get('/admin/dashboard/stats');
      return response.data;
    }
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.post('/admin/roles', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    }
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/admin/roles/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    }
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/admin/roles/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'roles'] });
    }
  });
};

// --- Accounts ---
export const useAccounts = (params = {}) => {
  return useQuery({
    queryKey: ['admin', 'accounts', params],
    queryFn: async () => {
      const response = await axiosClient.get('/admin/accounts', { params });
      return response.data;
    }
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const response = await axiosClient.post('/admin/accounts', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    }
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await axiosClient.put(`/admin/accounts/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    }
  });
};

export const useResetPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, new_password }) => {
      const response = await axiosClient.put(`/admin/accounts/${id}/reset-password`, { new_password });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    }
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const response = await axiosClient.delete(`/admin/accounts/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'accounts'] });
    }
  });
};
