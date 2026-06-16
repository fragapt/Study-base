// Hand-written DB types in the canonical `supabase gen types` shape
// (matches supabase/migrations/0001_init.sql). Regenerate from the live project
// with `supabase gen types typescript` if the schema changes.

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          subject_slug: string | null;
          title: string;
          description: string | null;
          done: boolean;
          due_date: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_slug?: string | null;
          title: string;
          description?: string | null;
          done?: boolean;
          due_date?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_slug?: string | null;
          title?: string;
          description?: string | null;
          done?: boolean;
          due_date?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      progress: {
        Row: {
          user_id: string;
          subject_slug: string;
          topic_key: string;
          done: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          subject_slug: string;
          topic_key: string;
          done?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          subject_slug?: string;
          topic_key?: string;
          done?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      sent_reminders: {
        Row: {
          id: string;
          user_id: string;
          exam_uid: string;
          offset_kind: string;
          sent_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exam_uid: string;
          offset_kind: string;
          sent_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exam_uid?: string;
          offset_kind?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};

export type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
export type ProgressRow = Database["public"]["Tables"]["progress"]["Row"];
export type PushSubscriptionRow =
  Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type SentReminderRow =
  Database["public"]["Tables"]["sent_reminders"]["Row"];
