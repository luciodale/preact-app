import { useState } from 'preact/hooks'

export function GeoLocation() {
  const [coords, setCoords] = useState<GeolocationCoordinates>()

  function getGeoLocation() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log(position)
        const pos = position.coords
        setCoords(pos)
      },
      (error) => {
        console.log('error', error)
      }
    )
  }

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
    </div>
  )
}
