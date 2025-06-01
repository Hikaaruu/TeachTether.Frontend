type Props = {
  messages: string[];
  className?: string;
};

export default function ValidationErrorList({
  messages,
  className = "mt-3",
}: Props) {
  if (messages.length === 0) return null;

  return (
    <div className={`alert alert-danger ${className}`} role="alert">
      <ul className="mb-0">
        {messages.map((msg, i) => (
          <li key={i}>{msg}</li>
        ))}
      </ul>
    </div>
  );
}
