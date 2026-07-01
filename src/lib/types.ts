import type { Database, MessageCategory } from "@/lib/database.types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Community = Database["public"]["Tables"]["communities"]["Row"];
export type CommunityWithCount = Database["public"]["Views"]["communities_with_counts"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];

/** Lightweight author shape embedded in messages/posts/events. */
export interface Author {
  id: string;
  name: string;
  avatar_url: string | null;
  current_country?: string | null;
  home_country?: string | null;
}

export type Message = Database["public"]["Tables"]["messages"]["Row"] & {
  author?: Author | null;
};

export type PostWithMeta = Post & {
  author?: Author | null;
  community?: Pick<Community, "id" | "name" | "type"> | null;
};

export type EventWithMeta = Event & {
  author?: Author | null;
  community?: Pick<Community, "id" | "name" | "type"> | null;
  attendee_count?: number;
  is_going?: boolean;
};

export type { MessageCategory };
