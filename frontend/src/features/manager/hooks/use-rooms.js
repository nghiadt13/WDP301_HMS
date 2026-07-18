import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roomApi, roomTypeApi, amenityApi, featureApi } from '../services/room-api';

export const useRooms = (params) =>
  useQuery({
    queryKey: ['rooms', params],
    queryFn: () => roomApi.getAll(params),
  });

export const useRoom = (id) =>
  useQuery({
    queryKey: ['room', id],
    queryFn: () => roomApi.getById(id),
    enabled: !!id,
  });

export const useCreateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

export const useUpdateRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => roomApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

export const useDeleteRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
};

// ─── Dropdown data ──────────────────────────────────────────
export const useRoomTypes = () =>
  useQuery({
    queryKey: ['roomTypes'],
    queryFn: () => roomTypeApi.getAll(),
  });

export const useRoomType = (id) =>
  useQuery({
    queryKey: ['roomType', id],
    queryFn: () => roomTypeApi.getById(id),
    enabled: !!id,
  });

export const useCreateRoomType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomTypeApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['roomTypes'] }),
  });
};

export const useUpdateRoomType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => roomTypeApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roomTypes'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useDeleteRoomType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: roomTypeApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roomTypes'] });
      qc.invalidateQueries({ queryKey: ['rooms'] });
    },
  });
};

export const useAmenities = () =>
  useQuery({
    queryKey: ['amenities'],
    queryFn: () => amenityApi.getAll(),
  });

export const useFeatures = () =>
  useQuery({
    queryKey: ['features'],
    queryFn: () => featureApi.getAll(),
  });
