export interface ItemFeedbackRef {
  show: (text: string, subText?: string, type?: 'success' | 'info') => void;
}
