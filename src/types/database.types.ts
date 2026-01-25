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
      items: {
        Row: {
          id: number;
          code: string;
          name: string;
          price: number;
          description: string | null;
          category: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          code: string;
          name: string;
          price?: number;
          description?: string | null;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          code?: string;
          name?: string;
          price?: number;
          description?: string | null;
          category?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: number;
          user_id: string;
          item_id: number;
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          item_id: number;
          quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          item_id?: number;
          quantity?: number;
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
      purchase_item: {
        Args: {
          p_item_id: number;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      add_minerals: {
        Args: {
          p_amount: number;
        };
        Returns: {
          success: boolean;
          message: string;
          minerals?: number;
        };
      };
      recover_stamina_ads: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          message: string;
          stamina?: number;
        };
      };
      check_and_recover_stamina: {
        Args: Record<string, never>;
        Returns: {
          stamina: number;
        };
      };
      handle_daily_login: {
        Args: Record<string, never>;
        Returns: {
          success: boolean;
          message: string;
          reward_minerals?: number;
          streak?: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
