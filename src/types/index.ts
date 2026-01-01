/**
 * 공통 타입 정의
 * 프로젝트 전반에서 사용되는 타입들을 중앙에서 관리합니다.
 */

// Quiz 관련 타입 (기존 quiz.ts에서 re-export)
export type {
  Category,
  MathTopic,
  LanguageType,
  LanguageSubTopic,
  LanguageTopic,
  LogicTopic,
  GeneralTopic,
  Topic,
  CategoryTopic,
  QuizQuestion,
  GameMode,
  Difficulty,
} from './quiz';

// API 관련 타입
export interface GameRecord {
  user_id: string;
  category: string;
  subject: string;
  level: number;
  mode: 'time-attack' | 'survival';
  score: number;
  cleared: boolean;
  cleared_at?: string;
  updated_at?: string;
}

export interface UserStats {
  totalHeight: number;
  totalSolved: number;
  maxLevel: number;
  bestSubject: string | null;
}

// 프로필 관련 타입
export interface UserProfile {
  profileId: string;
  nickname: string;
  createdAt: string;
  isAdmin?: boolean;
}

// 세션 관련 타입
export interface LocalSession {
  userId: string;
  isAdmin: boolean;
  loginTime: string;
  loginType?: 'anonymous' | 'supabase';
}

// 환경 변수 타입
export interface EnvConfig {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  IS_DEVELOPMENT: boolean;
  IS_PRODUCTION: boolean;
}

// 로깅 관련 타입
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// 에러 타입
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// 유틸리티 타입
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type Maybe<T> = T | null | undefined;

// 함수 타입
export type AsyncFunction<T = void> = () => Promise<T>;
export type Callback<T = void> = () => T;
