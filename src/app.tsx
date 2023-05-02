import { MutationCache, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  PersistQueryClientProvider,
  PersistedClient,
  Persister
} from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'
import toast, { Toaster } from 'react-hot-toast'
import './app.css'
import { Report } from './components/Report'
import { log } from './logger'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      cacheTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 2000,
      retry: 0
    }
  },
  mutationCache: new MutationCache({
    onSuccess: (data) => {
      log.debug('mutationCache.onSuccess', data)
      toast.success(data)
    },
    onError: (error) => {
      if (error instanceof Error) toast.error(error.message)
    }
  })
})

// we need a default mutation function so that paused mutations can resume after a page reload
queryClient.setMutationDefaults(['mutation'], {
  mutationFn: async ({ text }: { text: string }): Promise<string> => {
    // to avoid clashes with our optimistic update when an offline mutation continues
    await queryClient.cancelQueries({ queryKey: ['data'] })
    return fetch('/api/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text })
    }).then((res) => res.json())
  }
})

/**
 * Creates an Indexed DB persister
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
 */
export function createIDBPersister(idbValidKey: IDBValidKey = 'tbSpecialist') {
  return {
    persistClient: async (client: PersistedClient) => {
      set(idbValidKey, client)
    },
    restoreClient: async () => {
      const client = await get<PersistedClient>(idbValidKey)
      return client
    },
    removeClient: async () => {
      await del(idbValidKey)
    }
  } as Persister
}

const persister = createIDBPersister()

export function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => {
        log.debug('PersistQueryClientProvider.onSuccess')
        // resume mutations after initial restore from IDB was successful
        queryClient.resumePausedMutations().then(() => {
          queryClient.invalidateQueries()
        })
      }}
    >
      <Report />

      <Toaster />
      <ReactQueryDevtools initialIsOpen={false} />
    </PersistQueryClientProvider>
  )
}
