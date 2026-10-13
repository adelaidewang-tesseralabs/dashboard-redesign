import { useEffect, useState, type ReactNode } from 'react'
import { Check, Crown, Link2, UserX } from 'lucide-react'
import { can, ROLE_LABELS, type Access } from '../../../data/access'
import { CURRENT_USER, TEAMMATES, type Dashboard, type GeneralAccess, type MemberRole } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { cn } from '../../../lib/cn'
import { initialsOf, nameOf } from '../../../lib/people'
import { rememberRemoved } from '../../../lib/shareHistory'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { Select, type SelectOption } from '../../../ui/Select'
import { useToast } from '../../../ui/Toast'
import { ShareInviteSection } from './ShareInviteSection'

type ShareDialogProps = {
  open: boolean
  onClose: () => void
  dashboard: Dashboard
  role: Access
}

/** Production's share dialog names roles as nouns, unlike the "Can edit" labels elsewhere in the prototype. */
const PERMISSION_LABELS: Record<MemberRole, string> = { editor: 'Editor', viewer: 'Viewer' }

const ROLE_OPTIONS: SelectOption[] = [
  { value: 'editor', label: PERMISSION_LABELS.editor },
  { value: 'viewer', label: PERMISSION_LABELS.viewer },
]

const GENERAL_ACCESS: SelectOption[] = [
  { value: 'restricted', label: 'Only people invited' },
  { value: 'company', label: 'Everyone at Tessera' },
]

/** Production's share table: user, permission, then row actions. */
const ROW_GRID = 'grid grid-cols-[1fr_8rem_5rem] items-center gap-3 px-4'

function isMemberRole(value: string): value is MemberRole {
  return value === 'editor' || value === 'viewer'
}

function isGeneralAccess(value: string): value is GeneralAccess {
  return value === 'restricted' || value === 'company'
}

/** Laid out like production's `ShareDialog` parts, on top of the prototype's owner / general-access model. Every edit is live. */
export function ShareDialog({ open, onClose, dashboard, role }: ShareDialogProps) {
  const { addMember, setMemberRole, removeMember, setGeneralAccess, transferOwnership } = useDashboards()
  const toast = useToast()
  const [inviteRole, setInviteRole] = useState<MemberRole>('viewer')
  const [transferTo, setTransferTo] = useState<string | null>(null)
  const canShare = can(role, 'share')
  const isOwner = can(role, 'transferOwnership')
  const canChangeGeneralAccess = can(role, 'changeGeneralAccess')

  useEffect(() => {
    if (open) return
    setInviteRole('viewer')
    setTransferTo(null)
  }, [open])

  const share = (emails: string[]) => {
    for (const user of emails) addMember(dashboard.id, { user, role: inviteRole })
    toast(emails.length === 1 ? `Shared with ${emails[0]}` : `Shared with ${emails.length} users`)
    setInviteRole('viewer')
  }

  if (transferTo) {
    return (
      <Dialog
        open={open}
        onClose={() => setTransferTo(null)}
        title={`Make ${nameOf(transferTo)} the owner?`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTransferTo(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                transferOwnership(dashboard.id, transferTo)
                toast(`${nameOf(transferTo)} now owns this dashboard`)
                setTransferTo(null)
              }}
            >
              Transfer ownership
            </Button>
          </>
        }
      >
        <p className="text-sm text-white/60">
          You'll stay on as an editor. Only {nameOf(transferTo)} can change general access, archive or delete it, or transfer it back.
        </p>
      </Dialog>
    )
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="wide"
      title="Share Dashboard"
      description="Invite teammates to collaborate on this dashboard by setting their access level."
    >
      <div className="flex flex-col gap-6">
        {canShare && (
          <>
            <ShareInviteSection
              dashboardId={dashboard.id}
              existing={[dashboard.owner, ...dashboard.members.map((member) => member.user)]}
              suggestions={TEAMMATES}
              onShare={share}
              onPasteResult={toast}
              accessPicker={
                <Select aria-label="Permission" size="form" value={inviteRole} options={ROLE_OPTIONS} onChange={(value) => isMemberRole(value) && setInviteRole(value)} />
              }
            />
            <div role="separator" className="h-px bg-border" />
          </>
        )}

        <div className="flex flex-col overflow-hidden rounded-lg border border-border">
          <div className={cn(ROW_GRID, 'border-b border-border py-2 text-[11px] text-muted-foreground')}>
            <span>User</span>
            <span>Permission</span>
            <span aria-hidden />
          </div>
          <div className="max-h-80 overflow-y-auto">
            <PersonRow user={dashboard.owner} permission={<RoleBadge>{ROLE_LABELS.owner}</RoleBadge>} />
            {dashboard.members.map((member) => {
              const isSelf = member.user === CURRENT_USER
              return (
                <PersonRow
                  key={member.user}
                  user={member.user}
                  permission={
                    canShare ? (
                      <Select
                        aria-label={`Permission for ${member.user}`}
                        value={member.role}
                        options={ROLE_OPTIONS}
                        disabled={isSelf}
                        onChange={(value) => isMemberRole(value) && setMemberRole(dashboard.id, member.user, value)}
                      />
                    ) : (
                      <RoleBadge>{PERMISSION_LABELS[member.role]}</RoleBadge>
                    )
                  }
                  actions={
                    canShare && (
                      <>
                        {isOwner && <RowAction label="Make owner" onClick={() => setTransferTo(member.user)} icon={<Crown className="size-4" />} />}
                        <RowAction
                          label="Remove access"
                          destructive
                          disabled={isSelf}
                          onClick={() => {
                            removeMember(dashboard.id, member.user)
                            rememberRemoved(dashboard.id, member.user)
                            toast(`Removed access for ${member.user}`)
                          }}
                          icon={<UserX className="size-4" />}
                        />
                      </>
                    )
                  }
                />
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-input/20 px-3 py-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-xs font-medium text-white">General access</span>
            <span className="text-[11px] text-muted-foreground">
              {canChangeGeneralAccess ? 'Who can view it beyond the people above' : 'Only the owner can change general access'}
            </span>
          </div>
          <div className="w-48 shrink-0">
            <Select
              aria-label="General access"
              value={dashboard.generalAccess}
              options={GENERAL_ACCESS}
              disabled={!canChangeGeneralAccess}
              onChange={(value) => isGeneralAccess(value) && setGeneralAccess(dashboard.id, value)}
            />
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between gap-3">
          <CopyLinkButton onCopied={() => toast('Link copied')} />
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    </Dialog>
  )
}

function PersonRow({ user, permission, actions }: { user: string; permission: ReactNode; actions?: ReactNode }) {
  return (
    <div className={cn(ROW_GRID, 'border-b border-border py-3 last:border-none')}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-medium text-white">
          {initialsOf(user)}
        </span>
        <div className="flex min-w-0 flex-col">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm text-white">{nameOf(user)}</span>
            {user === CURRENT_USER && <span className="shrink-0 rounded-md border border-white/20 px-1.5 text-[10px] text-white/80">You</span>}
          </div>
          <span className="truncate text-[11px] text-muted-foreground">{user}</span>
        </div>
      </div>
      {permission}
      <div className="flex items-center justify-end gap-1">{actions}</div>
    </div>
  )
}

function RoleBadge({ children }: { children: ReactNode }) {
  return <span className="w-fit rounded-md bg-white/10 px-2 py-0.5 text-xs text-white/80">{children}</span>
}

type RowActionProps = { label: string; icon: ReactNode; onClick: () => void; destructive?: boolean; disabled?: boolean }

function RowAction({ label, icon, onClick, destructive, disabled }: RowActionProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(destructive && 'text-destructive hover:text-destructive')}
    >
      {icon}
    </Button>
  )
}

function CopyLinkButton({ onCopied }: { onCopied: () => void }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timeout = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(timeout)
  }, [copied])

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        void navigator.clipboard?.writeText(window.location.href)
        setCopied(true)
        onCopied()
      }}
    >
      {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
      {copied ? 'Copied' : 'Copy link'}
    </Button>
  )
}