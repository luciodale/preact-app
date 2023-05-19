import { useEffect, useState } from 'preact/hooks'

function useGeoLocation() {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(
    null
  )
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  function getGeoLocation() {
    setIsLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = position.coords
        setCoordinates(pos)
        setIsLoading(false)
      },
      (error) => {
        setError(error.message)
        setIsLoading(false)
      }
    )
  }

  useEffect(() => {
    getGeoLocation()
  }, [])

  return { coordinates, isLoading, error, getGeoLocation }
}

export function GeoLocation() {
  const { coordinates, isLoading, error } = useGeoLocation()

  return (
    <div className='w-fit'>
      {isLoading && <span>Finding Coordinates...</span>}
      {error && <div>Error: {error}</div>}
      {coordinates && (
        <div>
          <div>Latitude: {coordinates.latitude}</div>
          <div>Longitude: {coordinates.longitude}</div>
        </div>
      )}
    </div>
  )
}
