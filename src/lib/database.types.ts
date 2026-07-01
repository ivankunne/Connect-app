// Hand-authored to mirror supabase/migrations. If you wire up Supabase CLI,
// regenerate with:  supabase gen types typescript --local > src/lib/database.types.ts
//
// NOTE: each table/view carries a `Relationships` key — supabase-js's type
// helpers require it, otherwise insert/update payloads resolve to `never`.

export type CommunityType = "global" | "country" | "city" | "diaspora" | "hybrid";
export type MessageCategory =
  | "general"
  | "questions"
  | "housing"
  | "jobs"
  | "events"
  | "marketplace"
  | "food";
export type RsvpStatus = "going" | "maybe" | "not_going";

type Timestamped = { created_at: string };
type Rel = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          home_country: string | null;
          current_country: string | null;
          city: string | null;
          languages: string[];
          interests: string[];
          onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string;
          avatar_url?: string | null;
          home_country?: string | null;
          current_country?: string | null;
          city?: string | null;
          languages?: string[];
          interests?: string[];
          onboarded?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: Rel;
      };
      communities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          type: CommunityType;
          country: string | null;
          city: string | null;
          home_country: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          type: CommunityType;
          country?: string | null;
          city?: string | null;
          home_country?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["communities"]["Insert"]>;
        Relationships: Rel;
      };
      memberships: {
        Row: {
          id: string;
          user_id: string;
          community_id: string;
          source: "auto" | "manual";
          last_read_at: string;
        } & Timestamped;
        Insert: { id?: string; user_id: string; community_id: string; source?: "auto" | "manual"; last_read_at?: string };
        Update: { community_id?: string; user_id?: string; source?: "auto" | "manual"; last_read_at?: string };
        Relationships: Rel;
      };
      message_reactions: {
        Row: { id: string; message_id: string; user_id: string; emoji: string } & Timestamped;
        Insert: { id?: string; message_id: string; user_id: string; emoji: string };
        Update: { emoji?: string };
        Relationships: Rel;
      };
      blocks: {
        Row: { blocker_id: string; blocked_id: string } & Timestamped;
        Insert: { blocker_id: string; blocked_id: string };
        Update: Record<string, never>;
        Relationships: Rel;
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "message" | "user" | "post" | "dm";
          target_id: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "message" | "user" | "post" | "dm";
          target_id: string;
          reason?: string | null;
        };
        Update: Record<string, never>;
        Relationships: Rel;
      };
      direct_messages: {
        Row: {
          id: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          recipient_id: string;
          content: string;
          read_at?: string | null;
        };
        Update: { read_at?: string | null };
        Relationships: Rel;
      };
      messages: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          category: MessageCategory;
          content: string;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          category?: MessageCategory;
          content: string;
          image_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["messages"]["Insert"]>;
        Relationships: Rel;
      };
      events: {
        Row: {
          id: string;
          community_id: string;
          creator_id: string;
          title: string;
          description: string | null;
          datetime: string;
          location: string | null;
          max_attendees: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          creator_id: string;
          title: string;
          description?: string | null;
          datetime: string;
          location?: string | null;
          max_attendees?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
        Relationships: Rel;
      };
      event_attendees: {
        Row: { id: string; event_id: string; user_id: string; status: RsvpStatus } & Timestamped;
        Insert: { id?: string; event_id: string; user_id: string; status?: RsvpStatus };
        Update: { status?: RsvpStatus };
        Relationships: Rel;
      };
      event_comments: {
        Row: { id: string; event_id: string; user_id: string; content: string } & Timestamped;
        Insert: { id?: string; event_id: string; user_id: string; content: string };
        Update: { content?: string };
        Relationships: Rel;
      };
      posts: {
        Row: {
          id: string;
          community_id: string;
          user_id: string;
          title: string | null;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          title?: string | null;
          content: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: Rel;
      };
    };
    Views: {
      communities_with_counts: {
        Row: Database["public"]["Tables"]["communities"]["Row"] & { member_count: number };
        Relationships: Rel;
      };
    };
    Functions: {
      get_dm_threads: {
        Args: Record<string, never>;
        Returns: { partner_id: string; last_content: string; last_at: string; unread: number }[];
      };
      get_unread_counts: {
        Args: Record<string, never>;
        Returns: { community_id: string; unread: number }[];
      };
      mark_community_read: {
        Args: { target_community: string };
        Returns: undefined;
      };
    };
    Enums: {
      community_type: CommunityType;
      message_category: MessageCategory;
      rsvp_status: RsvpStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}
