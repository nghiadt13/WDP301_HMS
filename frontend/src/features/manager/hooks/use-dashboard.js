import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../api/axiosClient';

const fetchDashboardStats = async (filter) => {
  const response = await axiosInstance.get(`/manager/dashboard/stats?filter=${filter}`);
  return response.data.data;
};

export const useManagerDashboardStats = (filter = 'week') => {
  return useQuery({
    queryKey: ['manager', 'dashboard', 'stats', filter],
    queryFn: () => fetchDashboardStats(filter),
  });
};
