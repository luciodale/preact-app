import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import {
  Link,
  Outlet,
  RootRoute,
  Route,
  Router,
  RouterProvider
} from '@tanstack/router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { StrictMode } from 'preact/compat'
import { Toaster } from 'react-hot-toast'
import './app.css'
import { CameraView } from './components/CameraView'
import { GeoLocationView } from './components/GeolocationView'
import { QRCodeView } from './components/QRCodeView'
import { ReportView } from './components/ReportView'
import { fetchData, persister, queryClient } from './reactQuery'

const rootRoute = new RootRoute({
  component: () => (
    <>
      <div className='p-2 flex gap-2 text-lg'>
        {/* <Link
          to='/'
          activeProps={{
            className: 'font-bold'
          }}
          activeOptions={{ exact: true }}
        >
          Home
        </Link>
        <Link
          to='/report'
          activeProps={{
            className: 'font-bold'
          }}
        >
          Report
        </Link> */}
        <Link
          to='/geoLocation'
          activeProps={{
            className: 'font-bold'
          }}
        >
          Geolocation
        </Link>
        <Link
          to='/camera'
          activeProps={{
            className: 'font-bold'
          }}
        >
          Camera
        </Link>
        <Link
          to='/qrCode'
          activeProps={{
            className: 'font-bold'
          }}
        >
          QR Code
        </Link>
      </div>
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
  component: () => <ReportView />,
  errorComponent: () => 'Oh crap!'
})

const geolocationRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'geoLocation',
  component: () => <GeoLocationView />,
  errorComponent: () => 'Oh crap!'
})

const cameraRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'camera',
  component: () => <CameraView />,
  errorComponent: () => 'Oh crap!'
})

const qrcodeRoute = new Route({
  getParentRoute: () => rootRoute,
  path: 'qrCode',
  component: () => <QRCodeView />,
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
  geolocationRoute,
  cameraRoute,
  qrcodeRoute
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
          console.log('PersistQueryClientProvider.onSuccess')
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
