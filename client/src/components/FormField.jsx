export default function FormField({ label, className = '', children }) {
  return (
    <label className={['field', className].filter(Boolean).join(' ')}>
      <span>{label}</span>
      {children}
    </label>
  );
}
