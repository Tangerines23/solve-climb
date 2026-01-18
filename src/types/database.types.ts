/**
 * Solve-Climb Supabase Database Types
 * 이 파일은 데이터베이스의 스키마를 TypeScript 타입으로 정의합니다.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string | null;
          avatar_url: string | null;
          stamina: number;
          max_stamina: number;
          minerals: number;
          mastery_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname?: string | null;
          avatar_url?: string | null;
          stamina?: number;
          max_stamina?: number;
          minerals?: number;
          mastery_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string | null;
          avatar_url?: string | null;
          stamina?: number;
          max_stamina?: number;
          minerals?: number;
          mastery_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      game_records: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          subject: string;
          level: number;
          mode: string;
          score: number;
          cleared: boolean;
          cleared_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          subject: string;
          level: number;
          mode: string;
          score?: number;
          cleared?: boolean;
          cleared_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          subject?: string;
          level?: number;
          mode?: string;
          score?: number;
          cleared?: boolean;
          cleared_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      today_challenges: {
        Row: {
          id: string;
          challenge_date: string;
          category_id: string;
          category_name: string;
          topic_id: string;
          topic_name: string;
          level: number;
          mode: string;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          challenge_date: string;
          category_id: string;
          category_name: string;
          topic_id: string;
          topic_name: string;
          level: number;
          mode?: string;
          title: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          challenge_date?: string;
          category_id?: string;
          category_name?: string;
          topic_id?: string;
          topic_name?: string;
          level?: number;
          mode?: string;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_ranking: {
        Args: {
          p_category: string;
          p_mode: string;
          p_limit?: number;
        };
        Returns: {
          user_id: string;
          nickname: string;
          total_score: number;
          rank: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
