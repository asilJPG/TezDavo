// src/hooks/useGeolocation.ts
'use client'

import { useState, useEffect } from 'react'

interface Location {
  lat: number
  lng: number
  accuracy?: number
}

interface GeolocationState {
  location: Location | null
  error: string | null
  loading: boolean
}

export function useGeolocation(autoFetch = false): GeolocationState & { refetch: () => void } {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: autoFetch,
  })

  const fetch = () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Геолокация не поддерживается', loading: false }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          location: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          error: null,
          loading: false,
        })
      },
      (err) => {
        setState({
          location: null,
          error: err.code === 1 ? 'Доступ к геолокации запрещён' : 'Не удалось определить местоположение',
          loading: false,
        })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    )
  }

  useEffect(() => {
    if (autoFetch) fetch()
  }, [autoFetch])

  return { ...state, refetch: fetch }
}
