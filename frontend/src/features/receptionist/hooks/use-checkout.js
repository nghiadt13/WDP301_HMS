import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@/api/axiosClient';

export const useCheckoutSummary = (bookingId) => {
  return useQuery({
    queryKey: ['checkoutSummary', bookingId],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/receptionist/checkout/${bookingId}/summary`);
      return data;
    },
    enabled: !!bookingId
  });
};

export const useCreateInspection = (bookingId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskData) => {
      const { data } = await axiosClient.post(`/receptionist/checkout/${bookingId}/inspection`, taskData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspectionResults', bookingId] });
    }
  });
};

export const useInspectionResults = (bookingId) => {
  return useQuery({
    queryKey: ['inspectionResults', bookingId],
    queryFn: async () => {
      const { data } = await axiosClient.get(`/receptionist/checkout/${bookingId}/inspection`);
      return data;
    },
    enabled: !!bookingId
  });
};

export const useAddCharge = (bookingId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chargeData) => {
      const { data } = await axiosClient.post(`/receptionist/checkout/${bookingId}/charges`, chargeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkoutSummary', bookingId] });
    }
  });
};

export const useRemoveCharge = (bookingId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (chargeId) => {
      const { data } = await axiosClient.delete(`/receptionist/checkout/${bookingId}/charges/${chargeId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkoutSummary', bookingId] });
    }
  });
};

export const useGenerateInvoice = (bookingId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosClient.post(`/receptionist/checkout/${bookingId}/invoice`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkoutSummary', bookingId] });
    }
  });
};

export const useCompleteCheckout = (bookingId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (paymentData) => {
      const { data } = await axiosClient.post(`/receptionist/checkout/${bookingId}/complete`, paymentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['checkoutSummary', bookingId] });
    }
  });
};
