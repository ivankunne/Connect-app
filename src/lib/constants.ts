import type { MessageCategory } from "@/lib/database.types";
import {
  MessagesSquare,
  HelpCircle,
  Home,
  Briefcase,
  CalendarDays,
  ShoppingBag,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

/** The size below which a community is considered "quiet" and we merge
 *  visibility / suggestions upward so users never land in a dead chat. */
export const QUIET_THRESHOLD = 10;

/** Message categories are FILTERS over one shared stream, not separate chats. */
export interface ChannelDef {
  key: MessageCategory;
  label: string; // Norwegian editor/user-facing label
  icon: LucideIcon;
}

export const CHANNELS: ChannelDef[] = [
  { key: "general", label: "Generelt", icon: MessagesSquare },
  { key: "questions", label: "Spørsmål", icon: HelpCircle },
  { key: "housing", label: "Bolig", icon: Home },
  { key: "jobs", label: "Jobb", icon: Briefcase },
  { key: "events", label: "Arrangementer", icon: CalendarDays },
  { key: "marketplace", label: "Kjøp & salg", icon: ShoppingBag },
  { key: "food", label: "Mat & tips", icon: UtensilsCrossed },
];

export const DEFAULT_CHANNEL: MessageCategory = "general";
export const MESSAGE_PAGE_SIZE = 50;

export type AppView = "chat" | "events" | "feed";

export function isMessageCategory(value: string | null | undefined): value is MessageCategory {
  return !!value && CHANNELS.some((c) => c.key === value);
}

export function channelLabel(key: MessageCategory): string {
  return CHANNELS.find((c) => c.key === key)?.label ?? key;
}
