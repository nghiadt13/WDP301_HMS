import { useQuery } from '@tanstack/react-query';
import { housekeepingApi } from '../services/housekeeping-api.js';

export const useHousekeepingDashboard = () =>
  useQuery({
    queryKey: ['housekeeping-dashboard'],
    queryFn: housekeepingApi.getDashboardSummary,
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

export const useHousekeepingTasks = () =>
  useQuery({
    queryKey: ['housekeeping-tasks'],
    queryFn: housekeepingApi.getTasks,
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

export const useHousekeepingMaintenance = () =>
  useQuery({
    queryKey: ['housekeeping-maintenance'],
    queryFn: housekeepingApi.getMaintenanceRequests,
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

export const useHousekeepingServiceRequests = () =>
  useQuery({
    queryKey: ['housekeeping-service-requests'],
    queryFn: housekeepingApi.getServiceRequests,
    retry: 1,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
