import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const BUILDER_VERSIONS = ['v1', 'v2', 'v3', 'v3-1', 'v4', 'v5', 'v6'] as const
export type BuilderVersion = (typeof BUILDER_VERSIONS)[number]

const STORAGE_KEY = 'insights-prototype.builder-version'

function isBuilderVersionOption(value: string | null): value is BuilderVersion {
  return BUILDER_VERSIONS.some((version) => version === value)
}

/** Keep the prototype version on in-app links so list → detail does not fall back to V6. */
export function builderPath(path: string, version: BuilderVersion) {
  const [pathname, query] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('builder', version)
  return `${pathname}?${params}`
}

/**
 * Prototype-only switch between builder concepts; `?builder=v2` wins so a link can open a specific version.
 * Session-scoped so every new visit opens on V6 while a switch survives in-app links that drop the param.
 */
export function useBuilderVersion() {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('builder')
  const stored = sessionStorage.getItem(STORAGE_KEY)
  const version: BuilderVersion = isBuilderVersionOption(fromUrl) ? fromUrl : isBuilderVersionOption(stored) ? stored : 'v6'

  useEffect(() => {
    if (isBuilderVersionOption(fromUrl)) sessionStorage.setItem(STORAGE_KEY, fromUrl)
  }, [fromUrl])

  const setVersion = (next: BuilderVersion) => {
    sessionStorage.setItem(STORAGE_KEY, next)
    setParams(
      (current) => {
        current.set('builder', next)
        return current
      },
      { replace: true },
    )
  }

  return [version, setVersion] as const
}
