import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createCustomWorkout,
  createSession,
  deleteAllCustomWorkouts,
  deleteAllSessions,
  deleteCustomWorkout,
  listCustomWorkouts,
  listSessions,
} from '@/lib/localDatabase';

// Local-first records are stored in IndexedDB and remain available offline.
export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: listSessions,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useDeleteAllSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllSessions,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });
}

export function useCustomWorkouts() {
  return useQuery({
    queryKey: ['customWorkouts'],
    queryFn: listCustomWorkouts,
  });
}

export function useCreateCustomWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCustomWorkout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customWorkouts'] }),
  });
}

export function useDeleteCustomWorkout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCustomWorkout,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customWorkouts'] }),
  });
}

export function useDeleteAllCustomWorkouts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAllCustomWorkouts,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customWorkouts'] }),
  });
}
