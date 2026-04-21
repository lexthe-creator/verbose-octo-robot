// Step 5 — built next
export default function FocusTimer({ onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', color: 'var(--color-muted)', fontFamily: 'var(--font-body)' }}>
      <button onClick={onClose} style={{ color: 'var(--color-accent)' }}>← Focus Timer — coming soon</button>
    </div>
  )
}
