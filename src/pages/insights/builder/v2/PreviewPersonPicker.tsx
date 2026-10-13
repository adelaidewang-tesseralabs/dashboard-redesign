import { useState } from 'react'
import { Check, ChevronDown, Info, UserRoundPlus } from 'lucide-react'
import { ROLE_LABELS, roleOf, type Access } from '../../../../data/access'
import { CURRENT_USER, ORG_PEOPLE, type Dashboard } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { initialsOf, nameOf } from '../../../../lib/people'
import { menuGroupLabelClass, menuItemClass } from '../../../../ui/menuStyles'
import { Popover } from '../../../../ui/Popover'
import { SearchInput } from '../../../../ui/SearchInput'

type Candidate = { user: string; access: Access }

type PreviewPersonPickerProps = {
  dashboard: Dashboard
  person: string
  onChange: (user: string) => void
  /** Opens the share dialog with this person staged. */
  onGrantAccess?: (user: string) => void
}

/** People the dashboard is shared with, then — only while searching — everyone else at the company, who can't be picked. */
function candidates(dashboard: Dashboard, query: string): { shared: Candidate[]; others: Candidate[] } {
  const matches = (user: string) => !query || user.includes(query) || nameOf(user).toLowerCase().includes(query)
  const named = [dashboard.owner, ...dashboard.members.map((member) => member.user)].filter((user) => user !== CURRENT_USER)
  const shared = named.filter(matches).map((user) => ({ user, access: roleOf(dashboard, user) }))
  if (!query) return { shared, others: [] }
  const others = ORG_PEOPLE.filter((user) => user !== CURRENT_USER && !named.includes(user) && matches(user)).map((user) => ({ user, access: roleOf(dashboard, user) }))
  return { shared, others }
}

/** "Myself" by default; owners and editors can switch to anyone with access to check what their permissions show. */
export function PreviewPersonPicker({ dashboard, person, onChange, onGrantAccess }: PreviewPersonPickerProps) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const { shared, others } = candidates(dashboard, needle)
  const isMe = person === CURRENT_USER

  return (
    <Popover
      contentClassName="w-80 p-2"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Preview as"
          onClick={toggle}
          className="flex h-6 cursor-pointer items-center gap-1.5 rounded-md bg-white/10 pr-1.5 pl-1 font-medium text-white hover:bg-white/15"
        >
          <Avatar user={person} small />
          {isMe ? 'Yourself' : nameOf(person)}
          <ChevronDown className={cn('size-3.5 text-white/60 transition-transform', open && 'rotate-180')} />
        </button>
      )}
    >
      {(close) => {
        const pick = (user: string) => {
          onChange(user)
          close()
        }
        return (
          <div className="flex flex-col gap-1">
            <SearchInput value={query} onChange={setQuery} placeholder="Search people" autoFocus className="mb-1" />
            {(!needle || 'myself'.includes(needle) || CURRENT_USER.includes(needle)) && (
              <PersonRow user={CURRENT_USER} label="Myself" selected={isMe} onSelect={() => pick(CURRENT_USER)} />
            )}
            {shared.length > 0 && (
              <>
                <div className="my-1 h-px bg-white/10" />
                <div className={menuGroupLabelClass}>Shared with</div>
                {shared.map(({ user, access }) => (
                  <PersonRow key={user} user={user} detail={access ? ROLE_LABELS[access] : undefined} selected={person === user} onSelect={() => pick(user)} />
                ))}
              </>
            )}
            {others.length > 0 && (
              <>
                <div className="my-1 h-px bg-white/10" />
                <div className={menuGroupLabelClass}>Others at Tessera</div>
                {others.map(({ user, access }) =>
                  access ? (
                    <PersonRow key={user} user={user} detail="Can view · everyone" selected={person === user} onSelect={() => pick(user)} />
                  ) : (
                    <NoAccessRow
                      key={user}
                      user={user}
                      onGrant={
                        onGrantAccess &&
                        (() => {
                          close()
                          onGrantAccess(user)
                        })
                      }
                    />
                  ),
                )}
              </>
            )}
            {needle && shared.length + others.length === 0 && !'myself'.includes(needle) && <p className="px-2 py-3 text-xs text-white/50">No one matches "{query.trim()}"</p>}
            <div className="mt-1 flex items-start gap-2 border-t border-white/10 px-2 pt-2 text-[11px] text-white/50">
              <Info className="mt-px size-3.5 shrink-0" />
              Shows the dashboard's filters with this person's data access.
            </div>
          </div>
        )
      }}
    </Popover>
  )
}

function Avatar({ user, small = false }: { user: string; small?: boolean }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full bg-white/20 font-medium text-white', small ? 'size-4 text-[8px]' : 'size-7 text-[10px]')}>
      {initialsOf(user)}
    </span>
  )
}

function PersonRow({ user, label, detail, selected, onSelect }: { user: string; label?: string; detail?: string; selected: boolean; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={cn(menuItemClass, 'h-auto py-1.5')}>
      <Avatar user={user} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate">{label ?? nameOf(user)}</span>
        <span className="truncate text-[11px] text-white/50">{user}</span>
      </span>
      {detail && <span className="shrink-0 text-[11px] text-white/50">{detail}</span>}
      <Check className={cn('size-4 shrink-0 text-tlai-mint', !selected && 'invisible')} />
    </button>
  )
}

function NoAccessRow({ user, onGrant }: { user: string; onGrant?: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px]">
      <span className="opacity-50">
        <Avatar user={user} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-white/60">{nameOf(user)}</span>
        <span className="truncate text-[11px] text-white/40">No access</span>
      </span>
      {onGrant && (
        <button
          type="button"
          onClick={onGrant}
          className="flex h-6 shrink-0 cursor-pointer items-center gap-1 rounded-md border border-white/15 px-2 text-[11px] font-medium text-white hover:bg-white/10"
        >
          <UserRoundPlus className="size-3" />
          Grant access
        </button>
      )}
    </div>
  )
}
