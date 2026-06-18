import { statusLabel } from '../lib/strings'

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>{statusLabel(status)}</span>
  )
}
