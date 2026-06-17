// Hand-written DB types in the canonical `supabase gen types` shape
// (matches supabase/migrations/0001_init.sql + 0002_user_config.sql).
// Regenerate from the live project with `supabase gen types typescript`
// if the schema changes.

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
          topic_id: string | null;
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
          topic_id?: string | null;
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
          topic_id?: string | null;
        };
        Relationships: [];
      };
      app_settings: {
        Row: {
          user_id: string;
          exam_calendar_id: string | null;
          updated_at: string;
          ai_api_key: string | null;
          ai_model: string | null;
          ai_channel_id: string | null;
          ai_key_present: boolean;
        };
        Insert: {
          user_id: string;
          exam_calendar_id?: string | null;
          updated_at?: string;
          ai_api_key?: string | null;
          ai_model?: string | null;
          ai_channel_id?: string | null;
          ai_key_present?: boolean;
        };
        Update: {
          user_id?: string;
          exam_calendar_id?: string | null;
          updated_at?: string;
          ai_api_key?: string | null;
          ai_model?: string | null;
          ai_channel_id?: string | null;
          ai_key_present?: boolean;
        };
        Relationships: [];
      };
      drives: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          folder_id: string;
          resource_key: string | null;
          color: string;
          position: number;
          created_at: string;
          provider: string;
          repo_full: string | null;
          git_ref: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          folder_id: string;
          resource_key?: string | null;
          color?: string;
          position?: number;
          created_at?: string;
          provider?: string;
          repo_full?: string | null;
          git_ref?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          folder_id?: string;
          resource_key?: string | null;
          color?: string;
          position?: number;
          created_at?: string;
          provider?: string;
          repo_full?: string | null;
          git_ref?: string | null;
        };
        Relationships: [];
      };
      subjects: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          name: string;
          color: string;
          icon: string;
          exam_match: string[];
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          name: string;
          color?: string;
          icon?: string;
          exam_match?: string[];
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          name?: string;
          color?: string;
          icon?: string;
          exam_match?: string[];
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      subject_folders: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          drive_id: string | null;
          folder_id: string;
          resource_key: string | null;
          name: string | null;
          source: string;
          created_at: string;
          provider: string;
          repo_full: string | null;
          git_ref: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          drive_id?: string | null;
          folder_id: string;
          resource_key?: string | null;
          name?: string | null;
          source?: string;
          created_at?: string;
          provider?: string;
          repo_full?: string | null;
          git_ref?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          drive_id?: string | null;
          folder_id?: string;
          resource_key?: string | null;
          name?: string | null;
          source?: string;
          created_at?: string;
          provider?: string;
          repo_full?: string | null;
          git_ref?: string | null;
        };
        Relationships: [];
      };
      progress_topics: {
        Row: {
          id: string;
          user_id: string;
          subject_id: string;
          title: string;
          description: string | null;
          position: number;
          created_at: string;
          source: string;
          kind: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject_id: string;
          title: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          source?: string;
          kind?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject_id?: string;
          title?: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          source?: string;
          kind?: string;
        };
        Relationships: [];
      };
      topic_progress: {
        Row: {
          user_id: string;
          topic_id: string;
          done: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          topic_id: string;
          done?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          topic_id?: string;
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
export type AppSettingsRow = Database["public"]["Tables"]["app_settings"]["Row"];
export type DriveRow = Database["public"]["Tables"]["drives"]["Row"];
export type SubjectRow = Database["public"]["Tables"]["subjects"]["Row"];
export type SubjectFolderRow =
  Database["public"]["Tables"]["subject_folders"]["Row"];
export type ProgressTopicRow =
  Database["public"]["Tables"]["progress_topics"]["Row"];
export type TopicProgressRow =
  Database["public"]["Tables"]["topic_progress"]["Row"];
export type PushSubscriptionRow =
  Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type SentReminderRow =
  Database["public"]["Tables"]["sent_reminders"]["Row"];
