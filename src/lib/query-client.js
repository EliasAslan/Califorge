import { QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export const queryClientInstance = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const key = query.queryKey?.[0];
      if (key === 'sessions' || key === 'customWorkouts') {
        toast({
          title: 'Could not load local training data',
          description: error?.message || 'Check browser storage permissions and reload APEX.',
          variant: 'destructive',
        });
      }
    },
  }),
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
