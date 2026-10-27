export default function FeedbackMessage({ kind = 'error', role, children }) {
  return (
    <div className={`notice notice-${kind}`} role={role || (kind === 'error' ? 'alert' : 'status')}>
      {children}
    </div>
  );
}
