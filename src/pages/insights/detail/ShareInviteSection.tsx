import { useState, type ClipboardEvent, type FormEvent, type ReactNode } from 'react'
import { Mail, UserRoundPlus, X } from 'lucide-react'
import { forgetRemoved, rememberRecent, useRecentInvitees, useRemovedMembers } from '../../../lib/shareHistory'
import { Button } from '../../../ui/Button'
import { PeoplePicker } from './PeoplePicker'

type ShareInviteSectionProps = {
  dashboardId: string
  /** Emails the dashboard is already shared with, so they can't be staged twice. */
  existing: string[]
  suggestions: string[]
  accessPicker: ReactNode
  onShare: (emails: string[]) => void
  onPasteResult: (message: string) => void
  initialRecipients?: string[]
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DUPLICATE = 'This user already has a permission entry.'

/** Mirrors production's `ShareDialog.InviteSection`: recipients stage as chips, then one Share commits them all. */
export function ShareInviteSection({ dashboardId, existing, suggestions, accessPicker, onShare, onPasteResult, initialRecipients = [] }: ShareInviteSectionProps) {
  const recent = useRecentInvitees()
  const removed = useRemovedMembers(dashboardId)
  const [recipients, setRecipients] = useState(initialRecipients)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const taken = new Set([...existing, ...recipients])
  const draftEmail = draft.trim().toLowerCase()
  const pending = EMAIL.test(draftEmail) && !taken.has(draftEmail) ? [...recipients, draftEmail] : recipients

  const add = (raw: string) => {
    const email = raw.trim().toLowerCase()
    if (!EMAIL.test(email)) return setError('Enter a valid email address to share this dashboard.')
    if (taken.has(email)) return setError(DUPLICATE)
    setRecipients((current) => [...current, email])
    rememberRecent([email])
    setDraft('')
    setError(null)
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const tokens = event.clipboardData.getData('text').split(/[,;\s]+/).filter(Boolean)
    if (tokens.length < 2) return
    event.preventDefault()
    const seen = new Set(taken)
    const added: string[] = []
    let invalid = 0
    let duplicates = 0
    for (const token of tokens) {
      const email = token.toLowerCase()
      if (!EMAIL.test(email)) invalid++
      else if (seen.has(email)) duplicates++
      else {
        seen.add(email)
        added.push(email)
      }
    }
    setRecipients((current) => [...current, ...added])
    setError(null)
    const issues = [invalid && `${invalid} invalid`, duplicates && `${duplicates} already added`].filter(Boolean).join(', ')
    onPasteResult(issues ? `Added ${added.length} emails (${issues})` : `Added ${added.length} emails`)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (pending.length === 0) return
    onShare(pending)
    rememberRecent(pending)
    forgetRemoved(dashboardId, pending)
    setRecipients([])
    setDraft('')
    setError(null)
  }

  return (
    <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Invite people</span>
      <div className="flex items-center gap-6">
        <div className="flex flex-1 items-center gap-2">
          <PeoplePicker
            value={draft}
            onChange={setDraft}
            onCommit={add}
            onPaste={onPaste}
            recent={recent}
            removed={removed}
            suggestions={suggestions}
            exclude={taken}
          />
          <div className="w-32 shrink-0">{accessPicker}</div>
        </div>
        <Button type="submit" disabled={pending.length === 0}>
          <UserRoundPlus className="size-4" />
          Share{recipients.length > 0 ? ` (${recipients.length})` : ''}
        </Button>
      </div>

      {recipients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipients.map((email) => (
            <span key={email} className="inline-flex h-6 items-center gap-1.5 rounded-md bg-white/10 pr-1 pl-2 text-xs text-white/90">
              <Mail className="size-3" />
              {email}
              <button
                type="button"
                aria-label={`Remove ${email}`}
                onClick={() => setRecipients((current) => current.filter((item) => item !== email))}
                className="flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  )
}
