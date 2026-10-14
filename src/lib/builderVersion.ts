import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const BUILDER_VERSIONS = ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'final'] as const
export type BuilderVersion = (typeof BUILDER_VERSIONS)[number]

const STORAGE_KEY = 'insights-prototype.builder-version'

function isBuilderVersionOption(value: string | null): value is BuilderVersion {
  return BUILDER_VERSIONS.some((version) => version === value)
}

/** Keep the prototype version on in-app links so list → detail does not fall back to Final. */
export function builderPath(path: string, version: BuilderVersion) {
  const [pathname, query] = path.split('?')
  const params = new URLSearchParams(query)
  params.set('builder', version)
  return `${pathname}?${params}`
}

/**
 * Prototype-only switch between builder concepts; `?builder=v2` wins so a link can open a specific version.
 * Session-scoped so every new visit opens on Final while a switch survives in-app links that drop the param.
 */
export function useBuilderVersion() {
  const [params, setParams] = useSearchParams()
  const fromUrl = params.get('builder')
  const stored = sessionStorage.getItem(STORAGE_KEY)
  const version: BuilderVersion = isBuilderVersionOption(fromUrl) ? fromUrl : isBuilderVersionOption(stored) ? stored : 'final'

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

/** Final builder: `?mode=edit` opens a dashboard for editing; without it, editors land on the preview. */
export const EDIT_MODE_PARAM = 'mode'

/** Final: V6 reworked with the team's review feedback. Components deep in the builder branch on this instead of taking a prop. */
export function useIsFinalBuilder() {
  return useBuilderVersion()[0] === 'final'
}
