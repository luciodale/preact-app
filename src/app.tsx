import { MutationCache, QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  PersistQueryClientProvider,
  PersistedClient,
  Persister
} from '@tanstack/react-query-persist-client'
import {
  Link,
  Outlet,
  RootRoute,
  Route,
  Router,
  RouterProvider
} from '@tanstack/router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { del, get, set } from 'idb-keyval'
import { StrictMode } from 'preact/compat'
import toast, { Toaster } from 'react-hot-toast'
import './app.css'
import { GeoLocation } from './components/Geolocation'
import Report from './components/Report'
import { log } from './logger'
import { fetchData } from './queries'

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

const rootRoute = new RootRoute({
  component: () => (
    <>
      <div className='p-2 flex gap-2 text-lg'>
        <Link
          to='/'
          activeProps={{
            className: 'font-bold'
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>{' '}
        {/* <Link
          to='/report'
          activeProps={{
            className: 'font-bold'
          }}
        >
          Report
        </Link> */}
        <Link
          to='/geolocation'
          activeProps={{
            className: 'font-bold'
          }}
        >
          Geolocation
        </Link>
      </div>
      <hr />
      <Outlet /> {/* Start rendering router matches */}
      <TanStackRouterDevtools initialIsOpen={false} position='bottom-left' />
    </>
  )
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => (
    <div className='p-2'>
      <h3>Welcome Home!</h3>
    </div>
  )
})

const reportRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'report',
  loader: () =>
    queryClient.ensureQueryData({ queryKey: ['data'], queryFn: fetchData }),
  component: () => <Report />,
  errorComponent: () => 'Oh crap!'
})

const geolocationRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'geolocation',
  component: () => <GeoLocation />,
  errorComponent: () => 'Oh crap!'
})

declare module '@tanstack/router' {
  interface Register {
    router: typeof router
  }
}

const routeTree = rootRoute.addChildren([
  indexRoute,
  reportRoute,
  geolocationRoute
])

const router = new Router({
  routeTree,
  defaultPreload: 'intent'
})

export function App() {
  return (
    <StrictMode>
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
        <RouterProvider router={router} />
        <Toaster />
        <ReactQueryDevtools initialIsOpen={false} position='bottom-right' />
      </PersistQueryClientProvider>
    </StrictMode>
  )
}
