import { useState } from 'preact/hooks'
import './app.css'
import {
  QueryClient,
  QueryClientProvider,
  useQuery
} from '@tanstack/react-query'
import { Report } from './components/Report'

const queryClient = new QueryClient()

export function App() {
  const { isLoading, error, data } = useQuery<any, Error>({
    queryKey: ['repoData'],
    queryFn: () =>
      fetch('https://api.github.com/repos/tannerlinsley/react-query').then(
        (res) => res.json()
      )
  })

  if (isLoading) return 'Loading...'

  if (error) return 'An error has occurred: ' + error.message

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <Report />
      </QueryClientProvider>
    </>
  )
}
