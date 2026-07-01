import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarColor, cn, initials } from "@/lib/utils";

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  seed?: string;
  className?: string;
}

/** Avatar with a deterministic warm-colored fallback when there's no image. */
export function UserAvatar({ name, avatarUrl, seed, className }: UserAvatarProps) {
  const key = seed || name || "?";
  return (
    <Avatar className={cn("size-9", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ""} /> : null}
      <AvatarFallback style={{ backgroundColor: avatarColor(key) }}>
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
