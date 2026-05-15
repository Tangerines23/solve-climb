import React, { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: string;
}

/**
 * SEO (Search Engine Optimization) 컴포넌트
 * 페이지별 메타데이터를 관리합니다. (React Helmet 대체용 경량 구현)
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description = '수학 문제를 풀며 산을 정복하는 두뇌 계발 게임, Solve Climb!',
  keywords = '수학, 퀴즈, 교육, 게임, 산악, 정복, SolveClimb',
  ogImage = '/og-image.png',
  ogUrl = window.location.href,
  ogType = 'website',
}) => {
  const fullTitle = title ? `${title} | Solve Climb` : 'Solve Climb: 수학 정복의 길';

  useEffect(() => {
    // 문서 타이틀 업데이트
    document.title = fullTitle;

    // 메타 태그 업데이트 함수
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }

      element.setAttribute('content', content);
    };

    updateMeta('description', description);
    updateMeta('keywords', keywords);

    // Open Graph
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', ogImage, true);
    updateMeta('og:url', ogUrl, true);
    updateMeta('og:type', ogType, true);

    // Twitter
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', ogImage);
  }, [fullTitle, description, keywords, ogImage, ogUrl, ogType]);

  return null; // 렌더링은 하지 않고 부수 효과만 수행
};

export default SEO;
