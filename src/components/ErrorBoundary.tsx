/**
 * React Error Boundary 컴포넌트
 * 하위 컴포넌트에서 발생한 에러를 캐치하여 처리합니다.
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';
import { logError } from '../utils/errorHandler';
import { useErrorLogStore } from '../stores/useErrorLogStore';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 다음 렌더에서 fallback UI가 보이도록 상태를 업데이트합니다.
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logError('ErrorBoundary', error);

    // 에러 로그 스토어에 기록 (개발 환경에서만)
    if (import.meta.env.DEV) {
      useErrorLogStore
        .getState()
        .addLog(
          'error',
          error.message,
          error.stack,
          `ErrorBoundary: ${errorInfo.componentStack?.split('\n')[0] || 'Unknown component'}`
        );
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    // 커스텀 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback이 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 ErrorFallback 사용
      return <ErrorFallback error={this.state.error} resetError={this.handleReset} />;
    }

    return this.props.children;
  }
}
