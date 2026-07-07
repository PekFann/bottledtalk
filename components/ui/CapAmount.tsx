import BottleCapIcon from "@/components/ui/BottleCapIcon";

type Props = {
  amount: number;
  prefix?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  iconClassName?: string;
};

export default function CapAmount({
  amount,
  prefix,
  size = "sm",
  className = "",
  iconClassName = "",
}: Props) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {prefix && <span>{prefix}</span>}
      <span>{amount}</span>
      <BottleCapIcon size={size} className={iconClassName} />
    </span>
  );
}
