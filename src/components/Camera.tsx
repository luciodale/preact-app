import { useEffect, useRef, useState } from 'preact/hooks'

function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [capturedImages, setCapturedImages] = useState<string[]>([])

  useEffect(() => {
    let stream: MediaStream | null = null

    async function initCamera() {
      try {
        const constraints: MediaStreamConstraints =
          typeof window !== 'undefined' && 'mediaDevices' in navigator
            ? { video: { facingMode: 'environment' } } // Use back camera on mobile
            : { video: true } // Use any available camera on desktop

        stream = await navigator.mediaDevices.getUserMedia(constraints)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (error) {
        console.error('Error accessing camera:', error)
      }
    }

    initCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  function captureImage() {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')

      if (context) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageSrc = canvas.toDataURL('image/png')
        setCapturedImages((images) => [...images, imageSrc])
      }
    }
  }

  function removeImage(index: number) {
    setCapturedImages((images) => images.filter((_, i) => i !== index))
  }

  return {
    videoRef,
    canvasRef,
    capturedImages,
    captureImage,
    removeImage
  }
}

export function Camera() {
  const { videoRef, canvasRef, capturedImages, captureImage, removeImage } =
    useCamera()

  return (
    <div>
      <video ref={videoRef} autoPlay />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <button
        type='button'
        onClick={() => capturedImages.length < 4 && captureImage()}
      >
        Capture
      </button>
      <div className='flex gap-4'>
        {capturedImages.map((image, index) => (
          <div key={image} className='flex flex-col gap-2 items-center'>
            <img width={200} height={200} src={image} alt='Captured' />
            <button
              type='button'
              className='rounded-md bg-red-800 text-white w-fit'
              onClick={() => removeImage(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
