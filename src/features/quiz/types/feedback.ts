import { StatusType } from '@/constants/status';
export interface ItemFeedbackRef {
  show: (text: string, subText?: string, type?: StatusType | 'info') => void;
}
