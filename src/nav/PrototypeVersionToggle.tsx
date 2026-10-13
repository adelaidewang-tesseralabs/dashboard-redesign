import { ChevronDown, FlaskConical, UserRound } from 'lucide-react'
import { BUILDER_VERSIONS, useBuilderVersion, type BuilderVersion } from '../lib/builderVersion'
import { cn } from '../lib/cn'
import { ROLE_OVERRIDE_LABELS, ROLE_OVERRIDES, setRoleOverride, useRoleOverride } from '../lib/roleOverride'
import { Menu } from '../ui/Menu'

const VERSION_LABELS: Record<BuilderVersion, string> = {
  v1: 'V1 · Inline sources',
  v2: 'V2 · Data tab',
  v3: 'V3 · Production source dialogs',
  v4: 'V4 · Settings panel at the bottom',
  v5: 'V5 · Settings above chat',
  v6: 'V6 · Catalog only, no SQL',
}

/** Prototype-only control, always on screen, for comparing dashboard builder concepts. */
export function PrototypeVersionToggle() {
  return (
    <div className="fixed top-3.5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/15 bg-tlai-3/95 p-1 text-xs shadow-lg shadow-black/60 backdrop-blur">
      <VersionMenu />
      <span className="mx-0.5 h-4 w-px bg-white/15" />
      <RoleOverrideMenu />
    </div>
  )
}

function VersionMenu() {
  const [version, setVersion] = useBuilderVersion()
  return (
    <Menu
      align="start"
      items={[
        { type: 'label', label: 'Builder version' },
        ...BUILDER_VERSIONS.map((option) => ({ label: VERSION_LABELS[option], active: version === option, onSelect: () => setVersion(option) })),
      ]}
      trigger={({ toggle }) => (
        <button
          type="button"
          aria-label="Prototype version"
          title="Switch between dashboard builder concepts"
          onClick={toggle}
          className="flex h-6 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-white/70 hover:text-white"
        >
          <FlaskConical className="size-3.5 text-tlai-mint" />
          <span className="font-medium text-white uppercase">{version}</span>
          <ChevronDown className="size-3" />
        </button>
      )}
    />
  )
}

function RoleOverrideMenu() {
  const override = useRoleOverride()
  return (
    <Menu
      align="end"
      items={[
        { type: 'label', label: 'Viewing as' },
        ...ROLE_OVERRIDES.map((option) => ({ label: ROLE_OVERRIDE_LABELS[option], active: override === option, onSelect: () => setRoleOverride(option) })),
      ]}
      trigger={({ toggle }) => (
        <button
          type="button"
          aria-label="Viewing as"
          title="Act as a role on every dashboard"
          onClick={toggle}
          className={cn(
            'flex h-6 cursor-pointer items-center gap-1 rounded-full px-2.5 text-white/70 hover:text-white',
            override !== 'actual' && 'bg-tlai-mint/15 text-tlai-mint hover:text-tlai-mint',
          )}
        >
          <UserRound className="size-3.5" />
          {override === 'actual' ? 'My role' : ROLE_OVERRIDE_LABELS[override]}
          <ChevronDown className="size-3" />
        </button>
      )}
    />
  )
}
