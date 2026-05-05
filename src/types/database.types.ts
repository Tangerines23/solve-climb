export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '13.0.5';
  };
  public: {
    Tables: {
      badge_definitions: {
        Row: {
          created_at: string | null;
          description: string | null;
          emoji: string | null;
          id: string;
          name: string;
          required_levels: number[] | null;
          theme_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          emoji?: string | null;
          id: string;
          name: string;
          required_levels?: number[] | null;
          theme_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          emoji?: string | null;
          id?: string;
          name?: string;
          required_levels?: number[] | null;
          theme_id?: string;
        };
        Relationships: [];
      };
      game_config: {
        Row: {
          description: string | null;
          key: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          description?: string | null;
          key: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          description?: string | null;
          key?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          category: string | null;
          created_at: string | null;
          expires_at: string | null;
          game_mode: string | null;
          id: string;
          is_debug_session: boolean | null;
          level: number | null;
          questions: Json;
          result: Json | null;
          score: number | null;
          status: string;
          subject: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          game_mode?: string | null;
          id?: string;
          is_debug_session?: boolean | null;
          level?: number | null;
          questions: Json;
          result?: Json | null;
          score?: number | null;
          status?: string;
          subject?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          expires_at?: string | null;
          game_mode?: string | null;
          id?: string;
          is_debug_session?: boolean | null;
          level?: number | null;
          questions?: Json;
          result?: Json | null;
          score?: number | null;
          status?: string;
          subject?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      hall_of_fame: {
        Row: {
          created_at: string | null;
          id: string;
          mode: string;
          nickname: string;
          rank: number;
          score: number;
          tier_level: number | null;
          tier_stars: number | null;
          user_id: string;
          week_start_date: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          mode: string;
          nickname: string;
          rank: number;
          score: number;
          tier_level?: number | null;
          tier_stars?: number | null;
          user_id: string;
          week_start_date: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          mode?: string;
          nickname?: string;
          rank?: number;
          score?: number;
          tier_level?: number | null;
          tier_stars?: number | null;
          user_id?: string;
          week_start_date?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          created_at: string | null;
          id: number;
          item_id: number;
          quantity: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          item_id: number;
          quantity?: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          item_id?: number;
          quantity?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'items';
            referencedColumns: ['id'];
          },
        ];
      };
      items: {
        Row: {
          category: string | null;
          code: string;
          created_at: string | null;
          description: string | null;
          id: number;
          name: string;
          price: number;
          updated_at: string | null;
        };
        Insert: {
          category?: string | null;
          code: string;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          name: string;
          price?: number;
          updated_at?: string | null;
        };
        Update: {
          category?: string | null;
          code?: string;
          created_at?: string | null;
          description?: string | null;
          id?: number;
          name?: string;
          price?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      mode_mapping: {
        Row: {
          code: number;
          mode_id: string;
          name: string;
        };
        Insert: {
          code: number;
          mode_id: string;
          name: string;
        };
        Update: {
          code?: number;
          mode_id?: string;
          name?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          best_score_survival: number | null;
          best_score_timeattack: number | null;
          created_at: string | null;
          current_tier_level: number | null;
          cycle_promotion_pending: boolean | null;
          id: string;
          is_dummy: boolean | null;
          last_ad_stamina_recharge: string | null;
          last_game_submit_at: string | null;
          last_login_at: string | null;
          last_stamina_update: string | null;
          login_streak: number | null;
          minerals: number | null;
          nickname: string | null;
          pending_cycle_score: number | null;
          persona_type: string | null;
          stamina: number | null;
          total_mastery_score: number | null;
          updated_at: string | null;
          weekly_score_survival: number | null;
          weekly_score_timeattack: number | null;
          weekly_score_total: number | null;
        };
        Insert: {
          best_score_survival?: number | null;
          best_score_timeattack?: number | null;
          created_at?: string | null;
          current_tier_level?: number | null;
          cycle_promotion_pending?: boolean | null;
          id: string;
          is_dummy?: boolean | null;
          last_ad_stamina_recharge?: string | null;
          last_game_submit_at?: string | null;
          last_login_at?: string | null;
          last_stamina_update?: string | null;
          login_streak?: number | null;
          minerals?: number | null;
          nickname?: string | null;
          pending_cycle_score?: number | null;
          persona_type?: string | null;
          stamina?: number | null;
          total_mastery_score?: number | null;
          updated_at?: string | null;
          weekly_score_survival?: number | null;
          weekly_score_timeattack?: number | null;
          weekly_score_total?: number | null;
        };
        Update: {
          best_score_survival?: number | null;
          best_score_timeattack?: number | null;
          created_at?: string | null;
          current_tier_level?: number | null;
          cycle_promotion_pending?: boolean | null;
          id?: string;
          is_dummy?: boolean | null;
          last_ad_stamina_recharge?: string | null;
          last_game_submit_at?: string | null;
          last_login_at?: string | null;
          last_stamina_update?: string | null;
          login_streak?: number | null;
          minerals?: number | null;
          nickname?: string | null;
          pending_cycle_score?: number | null;
          persona_type?: string | null;
          stamina?: number | null;
          total_mastery_score?: number | null;
          updated_at?: string | null;
          weekly_score_survival?: number | null;
          weekly_score_timeattack?: number | null;
          weekly_score_total?: number | null;
        };
        Relationships: [];
      };
      security_audit_log: {
        Row: {
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: number;
          ip_address: unknown;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: number;
          ip_address?: unknown;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: number;
          ip_address?: unknown;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      theme_mapping: {
        Row: {
          code: number;
          name: string;
          theme_id: string;
        };
        Insert: {
          code: number;
          name: string;
          theme_id: string;
        };
        Update: {
          code?: number;
          name?: string;
          theme_id?: string;
        };
        Relationships: [];
      };
      tier_definitions: {
        Row: {
          color_var: string;
          created_at: string | null;
          icon: string;
          level: number;
          min_score: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          color_var: string;
          created_at?: string | null;
          icon: string;
          level: number;
          min_score: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          color_var?: string;
          created_at?: string | null;
          icon?: string;
          level?: number;
          min_score?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      today_challenges: {
        Row: {
          category_id: string;
          category_name: string;
          challenge_date: string;
          created_at: string | null;
          id: string;
          level: number;
          mode: string;
          title: string;
          topic_id: string;
          topic_name: string;
          updated_at: string | null;
        };
        Insert: {
          category_id: string;
          category_name: string;
          challenge_date: string;
          created_at?: string | null;
          id?: string;
          level: number;
          mode?: string;
          title: string;
          topic_id: string;
          topic_name: string;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string;
          category_name?: string;
          challenge_date?: string;
          created_at?: string | null;
          id?: string;
          level?: number;
          mode?: string;
          title?: string;
          topic_id?: string;
          topic_name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          badge_id: string;
          earned_at: string | null;
          id: number;
          user_id: string;
        };
        Insert: {
          badge_id: string;
          earned_at?: string | null;
          id?: number;
          user_id: string;
        };
        Update: {
          badge_id?: string;
          earned_at?: string | null;
          id?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      user_game_logs: {
        Row: {
          avg_solve_time: number | null;
          category_id: string | null;
          correct_count: number | null;
          created_at: string | null;
          game_mode: string;
          id: string;
          level: number | null;
          score: number | null;
          total_questions: number | null;
          user_id: string;
          world_id: string | null;
          wrong_answers: Json | null;
        };
        Insert: {
          avg_solve_time?: number | null;
          category_id?: string | null;
          correct_count?: number | null;
          created_at?: string | null;
          game_mode: string;
          id?: string;
          level?: number | null;
          score?: number | null;
          total_questions?: number | null;
          user_id: string;
          world_id?: string | null;
          wrong_answers?: Json | null;
        };
        Update: {
          avg_solve_time?: number | null;
          category_id?: string | null;
          correct_count?: number | null;
          created_at?: string | null;
          game_mode?: string;
          id?: string;
          level?: number | null;
          score?: number | null;
          total_questions?: number | null;
          user_id?: string;
          world_id?: string | null;
          wrong_answers?: Json | null;
        };
        Relationships: [];
      };
      user_identities: {
        Row: {
          created_at: string | null;
          id: string;
          identity_key: string;
          provider: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          identity_key: string;
          provider?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          identity_key?: string;
          provider?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      user_level_records: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_0: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_1: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_2: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_3: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_4: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_5: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_6: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_7: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_8: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_level_records_9: {
        Row: {
          best_score: number | null;
          category_id: string | null;
          id: number;
          level: number;
          mode_code: number;
          subject_id: string | null;
          theme_code: number;
          updated_at: string | null;
          user_id: string;
          world_id: string | null;
        };
        Insert: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level: number;
          mode_code: number;
          subject_id?: string | null;
          theme_code: number;
          updated_at?: string | null;
          user_id: string;
          world_id?: string | null;
        };
        Update: {
          best_score?: number | null;
          category_id?: string | null;
          id?: number;
          level?: number;
          mode_code?: number;
          subject_id?: string | null;
          theme_code?: number;
          updated_at?: string | null;
          user_id?: string;
          world_id?: string | null;
        };
        Relationships: [];
      };
      user_statistics: {
        Row: {
          avg_solve_time: number | null;
          best_streak: number | null;
          id: string;
          last_played_at: string | null;
          total_correct: number | null;
          total_games: number | null;
          total_questions: number | null;
          updated_at: string | null;
        };
        Insert: {
          avg_solve_time?: number | null;
          best_streak?: number | null;
          id: string;
          last_played_at?: string | null;
          total_correct?: number | null;
          total_games?: number | null;
          total_questions?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avg_solve_time?: number | null;
          best_streak?: number | null;
          id?: string;
          last_played_at?: string | null;
          total_correct?: number | null;
          total_games?: number | null;
          total_questions?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      ranking_view: {
        Row: {
          best_score_survival: number | null;
          best_score_timeattack: number | null;
          current_tier_level: number | null;
          id: string | null;
          nickname: string | null;
          total_mastery_score: number | null;
          weekly_score_survival: number | null;
          weekly_score_timeattack: number | null;
          weekly_score_total: number | null;
        };
        Insert: {
          best_score_survival?: number | null;
          best_score_timeattack?: number | null;
          current_tier_level?: number | null;
          id?: string | null;
          nickname?: string | null;
          total_mastery_score?: number | null;
          weekly_score_survival?: number | null;
          weekly_score_timeattack?: number | null;
          weekly_score_total?: number | null;
        };
        Update: {
          best_score_survival?: number | null;
          best_score_timeattack?: number | null;
          current_tier_level?: number | null;
          id?: string | null;
          nickname?: string | null;
          total_mastery_score?: number | null;
          weekly_score_survival?: number | null;
          weekly_score_timeattack?: number | null;
          weekly_score_total?: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      calculate_tier: { Args: { p_total_score: number }; Returns: Json };
      calculate_tier_level: { Args: { p_score: number }; Returns: number };
      check_and_award_badges: { Args: { p_user_id: string }; Returns: Json };
      check_and_recover_stamina: { Args: never; Returns: Json };
      check_mastery_consistency: {
        Args: never;
        Returns: {
          out_message: string;
          out_nickname: string;
          out_profile_score: number;
          out_records_sum: number;
          out_user_id: string;
        }[];
      };
      cleanup_expired_sessions: {
        Args: { p_days_to_keep?: number };
        Returns: Json;
      };
      create_game_session: {
        Args: {
          p_category?: string;
          p_game_mode?: string;
          p_is_debug_session?: boolean;
          p_level?: number;
          p_questions: Json;
          p_subject?: string;
        };
        Returns: Json;
      };
      debug_create_persona_player: {
        Args: { p_nickname: string; p_persona_type?: string };
        Returns: Json;
      };
      debug_delete_all_dummies: { Args: never; Returns: Json };
      debug_delete_dummy_user: { Args: { p_user_id: string }; Returns: Json };
      debug_grant_badge: {
        Args: { p_badge_id: string; p_user_id: string };
        Returns: Json;
      };
      debug_grant_items: { Args: never; Returns: Json };
      debug_purchase_item_security: {
        Args: { p_bypass: boolean; p_item_id: number; p_user_id: string };
        Returns: Json;
      };
      debug_remove_badge: {
        Args: { p_badge_id: string; p_user_id: string };
        Returns: Json;
      };
      debug_reset_inventory: { Args: { p_user_id: string }; Returns: Json };
      debug_reset_level_progress: {
        Args: { p_category_id: string; p_subject_id: string; p_user_id: string };
        Returns: Json;
      };
      debug_reset_profile: {
        Args: { p_reset_type: string; p_user_id: string };
        Returns: Json;
      };
      debug_run_play_scenario: {
        Args: {
          p_avg_combo: number;
          p_avg_correct: number;
          p_category_id: string;
          p_game_mode: string;
          p_iterations: number;
          p_level: number;
          p_subject_id: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      debug_seed_badge_definitions: { Args: { p_badges: Json }; Returns: Json };
      debug_set_inventory_quantity: {
        Args: { p_item_id: number; p_quantity: number; p_user_id: string };
        Returns: Json;
      };
      debug_set_mastery_score: {
        Args: { p_score: number; p_user_id: string };
        Returns: Json;
      };
      debug_set_minerals: { Args: { p_minerals: number }; Returns: Json };
      debug_set_session_timer: {
        Args: { p_seconds: number; p_session_id: string };
        Returns: Json;
      };
      debug_set_stamina: { Args: { p_stamina: number }; Returns: Json };
      debug_set_tier: {
        Args: { p_level: number; p_user_id: string };
        Returns: Json;
      };
      debug_update_profile_stats: {
        Args: {
          p_minerals?: number;
          p_stamina?: number;
          p_total_mastery_score?: number;
          p_user_id: string;
        };
        Returns: Json;
      };
      get_leaderboard: {
        Args: { p_limit?: number; p_mode: string };
        Returns: {
          nickname: string;
          rank: number;
          score: number;
          user_id: string;
        }[];
      };
      get_ranking_v2: {
        Args: {
          p_category: string;
          p_limit?: number;
          p_period: string;
          p_type: string;
        };
        Returns: {
          out_nickname: string;
          out_rank: number;
          out_score: number;
          out_user_id: string;
        }[];
      };
      get_recent_game_logs: { Args: { p_limit?: number }; Returns: Json };
      get_user_game_stats: { Args: never; Returns: Json };
      log_security_event: {
        Args: { p_data?: Json; p_event_type: string };
        Returns: undefined;
      };
      promote_to_next_cycle: { Args: never; Returns: undefined };
      purchase_item: {
        Args: { p_item_id: number; p_quantity?: number };
        Returns: Json;
      };
      recalculate_mastery_scores: { Args: never; Returns: Json };
      reset_weekly_scores: { Args: never; Returns: undefined };
      restore_default_items: { Args: never; Returns: Json };
      rpc_update_nickname: { Args: { p_nickname: string }; Returns: Json };
      secure_reset_progress: { Args: never; Returns: Json };
      secure_reward_ad_view: { Args: never; Returns: Json };
      submit_game_result: {
        Args: {
          p_avg_solve_time?: number;
          p_category?: string;
          p_game_mode: string;
          p_items_used: Json;
          p_level?: number;
          p_question_ids: Json;
          p_session_id: string;
          p_subject?: string;
          p_user_answers: Json;
        };
        Returns: Json;
      };
      test_db_all_validations: {
        Args: never;
        Returns: {
          details: Json;
          message: string;
          result: boolean;
          test_name: string;
        }[];
      };
      test_db_business_logic_validation: {
        Args: never;
        Returns: {
          details: Json;
          message: string;
          result: boolean;
          test_name: string;
        }[];
      };
      test_db_json_validation: {
        Args: never;
        Returns: {
          details: Json;
          message: string;
          result: boolean;
          test_name: string;
        }[];
      };
      test_db_performance_validation: {
        Args: never;
        Returns: {
          details: Json;
          message: string;
          result: boolean;
          test_name: string;
        }[];
      };
      test_db_rpc_validation: {
        Args: never;
        Returns: {
          details: Json;
          message: string;
          result: boolean;
          test_name: string;
        }[];
      };
      test_db_security_validation: {
        Args: never;
        Returns: {
          details: Json;
          message: string;
          result: boolean;
          test_name: string;
        }[];
      };
      update_user_tier: { Args: { p_user_id: string }; Returns: Json };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
