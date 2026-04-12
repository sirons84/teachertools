interface Props {
  html: string;
  isLoading?: boolean;
}

export default function DocumentViewer({ html, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${70 + (i % 3) * 10}%` }} />
        ))}
      </div>
    );
  }

  return (
    <div
      className="document-content prose prose-sm max-w-none text-gray-800"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
