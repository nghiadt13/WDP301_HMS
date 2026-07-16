import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi, roomApi, roomTypeApi } from '../services/receptionist-api';

export const useBookings = (params) =>
  useQuery({
    queryKey: ['receptionist-bookings', params],
    queryFn: () => bookingApi.getAll(params),
  });

export const useBooking = (id) =>
  useQuery({
    queryKey: ['receptionist-booking', id],
    queryFn: () => bookingApi.getById(id),
    enabled: !!id,
  });

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => bookingApi.checkIn(id, data),
    onSuccess: (res, variables) => {
      qc.invalidateQueries({ queryKey: ['receptionist-bookings'] });
      qc.invalidateQueries({ queryKey: ['receptionist-booking', variables.id] });
    },
  });
};

export const useCreateWalkIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bookingApi.createWalkIn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['receptionist-bookings'] });
    },
  });
};

export const useAvailableRooms = (params) =>
  useQuery({
    queryKey: ['available-rooms', params],
    queryFn: () => roomApi.getAvailable(params),
    enabled: !!params.roomTypeId && !!params.checkInDate && !!params.checkOutDate,
  });

export const useReceptionistRoomTypes = () =>
  useQuery({
    queryKey: ['receptionist-room-types'],
    queryFn: roomTypeApi.getAll,
  });

export const useDashboardStats = () =>
  useQuery({
    queryKey: ['receptionist-dashboard-stats'],
    queryFn: bookingApi.getDashboardStats,
    refetchInterval: 10000 // auto-refresh every 10 seconds for real-time stats
  });
