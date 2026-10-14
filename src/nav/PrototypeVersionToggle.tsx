import { ChevronDown, FlaskConical, Pin, UserRound } from 'lucide-react'
import { BUILDER_VERSIONS, useBuilderVersion, type BuilderVersion } from '../lib/builderVersion'
import { cn } from '../lib/cn'
import { FIXED_FILTER_STYLE_LABELS, FIXED_FILTER_STYLES, setFixedFilterStyle, useFixedFilterStyle } from '../lib/fixedFilterStyle'
import { ROLE_OVERRIDE_LABELS, ROLE_OVERRIDES, setRoleOverride, useRoleOverride } from '../lib/roleOverride'
import { Menu } from '../ui/Menu'

const VERSION_LABELS: Record<BuilderVersion, string> = {
  v1: 'V1 · Inline sources',
  v2: 'V2 · Data tab',
  v3: 'V3 · Production source dialogs',
  'v3-1': 'V3.1 · Tools on the left',
  v4: 'V4 · Settings panel at the bottom',
  v5: 'V5 · Settings above chat',
  v6: 'V6 · Catalog only, no SQL',
}

/** Prototype-only control, always on screen, for comparing dashboard builder concepts. */
export function PrototypeVersionToggle() {
  const [version, setVersion] = useBuilderVersion()
  return (
    <div className="fixed top-3.5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-0.5 rounded-full border border-white/15 bg-tlai-3/95 p-1 text-xs shadow-lg shadow-black/60 backdrop-blur">
      <VersionMenu version={version} setVersion={setVersion} />
      {version === 'v6' && (
        <>
          <span className="mx-0.5 h-4 w-px bg-white/15" />
          <FixedFilterStyleMenu />
        </>
      )}
      <span className="mx-0.5 h-4 w-px bg-white/15" />
      <RoleOverrideMenu />
    </div>
  )
}

function FixedFilterStyleMenu() {
  const style = useFixedFilterStyle()
  return (
    <Menu
      align="start"
      items={[
        { type: 'label', label: 'Fixed filter style' },
        ...FIXED_FILTER_STYLES.map((option) => ({ label: FIXED_FILTER_STYLE_LABELS[option], active: style === option, onSelect: () => setFixedFilterStyle(option) })),
      ]}
      trigger={({ toggle }) => (
        <button
          type="button"
          aria-label="Fixed filter style"
          title="Compare how fixed filters are told apart"
          onClick={toggle}
          className="flex h-6 cursor-pointer items-center gap-1 rounded-full px-2.5 text-white/70 hover:text-white"
        >
          <Pin className="size-3.5" />
          Fixed · {FIXED_FILTER_STYLE_LABELS[style].split(' · ')[0]}
          <ChevronDown className="size-3" />
        </button>
      )}
    />
  )
}

function VersionMenu({ version, setVersion }: { version: BuilderVersion; setVersion: (next: BuilderVersion) => void }) {
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
          <span className="font-medium text-white uppercase">{version.replace('-', '.')}</span>
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
