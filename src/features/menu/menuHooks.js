import { useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from './menuService';
import { toast } from 'sonner';

export function useUpdateMenuDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bookingId, payload }) => menuService.updateMenuDecision(bookingId, payload),
    onSuccess: (_, { payload }) => {
      queryClient.invalidateQueries({ queryKey: ['pms_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pms_dashboard'] });
      toast.success(`Menu status updated to ${payload.status}!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update menu decision.');
    },
  });
}
