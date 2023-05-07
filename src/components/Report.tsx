import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'preact/hooks'
import { log } from '../logger'
import { fetchData } from '../queries'

export default function Report() {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState<string>()

  const { isLoading, error, data } = useQuery<string[], Error>({
    queryKey: ['data'],
    queryFn: fetchData
  })

  const [coords, setCoords] = useState<GeolocationCoordinates>()

  function getGeoLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('position', position)
        const pos = position.coords
        setCoords(pos)
      },
      (error) => {
        log.debug('error', error)
      }
    )
  }

  const updateList = useMutation<
    Promise<string>,
    Promise<Error>,
    { text: string }
  >({
    mutationKey: ['mutation'],
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['data'] })
      const previousData = queryClient.getQueryData<string[]>(['data']) || []

      // remove local state so that server state is taken instead
      setComment(undefined)

      queryClient.setQueryData(['data'], [...previousData, comment])

      return previousData
    },
    onError: (_, __, context) => {
      log.debug('onError', context)
      // TODO: fix the context type. It should be the same as the return type of onMutate
      // queryClient.setQueryData(['data'], context?.previousData)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['data'] })
    }
  })

  function submitForm(event: Event) {
    event.preventDefault()
    if (comment) updateList.mutate({ text: comment })
  }

  if (isLoading) return <>Is Loading</>

  if (error) return <>`An error has occurred: ${error.message}`</>

  return (
    <div className='bg-green-800'>
      <button type='button' onClick={getGeoLocation}>
        Get Geo Location
      </button>
      {coords && (
        <div>
          <div>Latitude: {coords.latitude}</div>
          <div>Longitude: {coords.longitude}</div>
        </div>
      )}

      <form onSubmit={submitForm}>
        <label htmlFor='comment'>
          Comment
          <input
            name='comment'
            value={comment}
            onChange={(event) => {
              const { target } = event
              if (target) setComment((target as HTMLInputElement).value)
            }}
          />
        </label>
      </form>
      {data.map((item) => (
        <div key={item}>{item}</div>
      ))}
    </div>
  )
}
