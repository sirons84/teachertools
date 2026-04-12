interface Props {
  size?: "sm" | "md" | "lg";
  text?: string;
}

const SIZE_MAP = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-4",
};

export default function LoadingSpinner({ size = "md", text }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div
        className={`${SIZE_MAP[size]} rounded-full border-gray-200 border-t-blue-600 animate-spin`}
      />
      {text && <p className="text-sm text-gray-500">{text}</p>}
    </div>
  );
}
