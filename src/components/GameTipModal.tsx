import React, { useState, useEffect } from 'react';
import { HIRAGANA_MAPPINGS } from '../utils/japanese';
import './GameTipModal.css';

interface GameTipModalProps {
  isOpen: boolean;
  category: string;
  subTopic: string;
  level?: number | null;
  onClose: () => void;
}

export function GameTipModal({ isOpen, category, subTopic, level, onClose }: GameTipModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [orientationKey, setOrientationKey] = useState(0);

  // localStorage에서 "다시 보지 않기" 설정 확인
  useEffect(() => {
    if (isOpen) {
      const tipKey = level ? `gameTip_${category}_${subTopic}_${level}` : `gameTip_${category}_${subTopic}`;
      const shouldHide = localStorage.getItem(tipKey) === 'true';
      if (shouldHide) {
        onClose();
      }
    }
  }, [isOpen, category, subTopic, level, onClose]);

  // orientation 변경 감지 및 강제 리렌더링
  useEffect(() => {
    const checkOrientation = () => {
      // 실제 뷰포트 크기로 orientation 확인
      const isLandscape = window.innerWidth > window.innerHeight;
      const modalElement = document.querySelector('.game-tip-modal');
      
      if (modalElement) {
        if (isLandscape) {
          modalElement.classList.add('force-landscape');
          modalElement.classList.remove('force-portrait');
        } else {
          modalElement.classList.add('force-portrait');
          modalElement.classList.remove('force-landscape');
        }
      }
      
      // 강제 리렌더링을 위한 상태 업데이트
      setOrientationKey(prev => prev + 1);
    };

    // 초기 확인
    checkOrientation();

    // 이벤트 리스너 추가
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);
    
    // 약간의 지연을 두고 다시 확인 (뷰포트 크기 안정화 대기)
    const timeoutId = setTimeout(checkOrientation, 100);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('orientationchange', checkOrientation);
      window.removeEventListener('resize', checkOrientation);
    };
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    if (dontShowAgain) {
      const tipKey = level ? `gameTip_${category}_${subTopic}_${level}` : `gameTip_${category}_${subTopic}`;
      localStorage.setItem(tipKey, 'true');
    }
    onClose();
  };

  const getTipData = () => {
    // 사칙연산 팁
    if (category === 'math' && subTopic === 'arithmetic') {
      const title = '🧮 사칙연산 팁';
      const description = '핵심 로직: "숫자를 쪼개거나(Split), 10을 만들어라(Make 10)."';
      
      if (!level) {
        return { title, description, section: null, other: null };
      }

        const tips: Record<number, { title: string; tip: string; example: string; strategy: string }> = {
          1: {
            title: '1레벨: 반사신경 덧셈',
            tip: '계산 금지. 이미지를 떠올리세요.',
            example: '3+4=?',
            strategy: '숫자를 보자마자 구구단 외우듯 답을 찍으세요. 망설이면 늦습니다.'
          },
          2: {
            title: '2레벨: 반사신경 뺄셈',
            tip: '2+□=9 (거꾸로 더하기)',
            example: '9−2=?',
            strategy: '빼기가 어렵다면, 작은 수에 무엇을 더해야 큰 수가 되는지 찾으세요.'
          },
          3: {
            title: '3레벨: 부호 판단',
            tip: '가운데 기호(+,−) 먼저 스캔 → 숫자 보기',
            example: '3+5 또는 9−4 (랜덤)',
            strategy: '숫자를 먼저 보면 뇌가 헷갈립니다. 부호부터 확인하고 계산 모드를 전환하세요.'
          },
          4: {
            title: '4레벨: 10 만들기',
            tip: '8→ 2가 필요해! → 5에서 2를 뺏어옴 → 13',
            example: '8+5=?',
            strategy: '앞의 숫자를 무조건 10으로 채우고, 남은 찌꺼기를 일의 자리에 붙이세요.'
          },
          5: {
            title: '5레벨: 빌려오기',
            tip: '10−7=3 → 3+5=8',
            example: '15−7=?',
            strategy: '일의 자리(5−7)가 안 되면, 십의 자리(10)에서 먼저 빼버리고 남은 걸 더하세요.'
          },
          6: {
            title: '6레벨: 연속 계산',
            tip: '20은 무시. 5+7=12만 계산 → 앞에 20 붙이기',
            example: '25+7=?',
            strategy: '십의 자리는 잠깐 잊으세요. 일의 자리끼리 승부를 보고 나중에 합치세요.'
          },
          7: {
            title: '7레벨: 구구단 기초',
            tip: '입으로 중얼거리기 ("사육에 이십사")',
            example: '4×6=?',
            strategy: '눈으로 풀지 말고 마음속 소리로 푸는 게 가장 빠릅니다.'
          },
          8: {
            title: '8레벨: 구구단 심화',
            tip: '9×7이 안 떠오르면 7×9를 떠올리기',
            example: '9×7=?',
            strategy: '순서를 바꿔도 답은 같습니다. 더 익숙한 순서로 뒤집어서 생각하세요.'
          },
          9: {
            title: '9레벨: 나눗셈',
            tip: '6×□=42 (빈칸 곱셈)',
            example: '42÷6=?',
            strategy: '나누기는 없습니다. 구구단에서 짝을 찾는 게임이라고 생각하세요.'
          },
          10: {
            title: '10레벨: 자리수 분리',
            tip: '앞끼리(2+3=5), 뒤끼리(4+8=12) → 합체(62)',
            example: '24+38=?',
            strategy: '한 번에 하려 하지 마세요. 십의 자리와 일의 자리를 찢어서 따로 계산하세요.'
          },
          11: {
            title: '11레벨: 세 수 연산',
            tip: '앞에서부터 차근차근. 기억력 싸움.',
            example: '5+8−3=?',
            strategy: '5+8=13을 단기 기억에 저장하고, 바로 3을 빼세요.'
          },
          12: {
            title: '12레벨: 암산 곱셈',
            tip: '10개씩 3번(30) + 2개씩 3번(6) → 36',
            example: '12×3=?',
            strategy: '숫자를 10과 나머지로 분해해서 각각 곱하고 더하세요.'
          },
          13: {
            title: '13레벨: 우선순위',
            tip: '×,÷ 주변에 투명 괄호 치기 → (5×2) 먼저!',
            example: '3+5×2=?',
            strategy: '더하기는 함정입니다. 곱하기 양옆의 숫자를 먼저 뭉치세요.'
          },
          14: {
            title: '14레벨: 역산 빈칸',
            tip: '15와 6을 직접 빼버리기 (15−6=9)',
            example: '15−□=6',
            strategy: '뺄셈 식에서는 답과 빈칸의 자리를 바꿔도 성립합니다.'
          },
          15: {
            title: '15레벨: 괄호 마스터',
            tip: '괄호는 VIP. 무조건 1순위 처리.',
            example: '(3+4)×5=?',
            strategy: '괄호 안을 하나의 숫자(7)로 만든 뒤에 곱하기를 시작하세요.'
          }
        };

        const tipData = tips[level];
        if (!tipData) {
          return { title, description, section: null, other: null };
        }

        const section = (
          <div className="game-tip-section">
            <h4>{tipData.title}</h4>
            <p><strong>팁:</strong> {tipData.tip}</p>
            <p><strong>공략:</strong> {tipData.strategy}</p>
            <div className="game-tip-example">
              <p><strong>예시:</strong> {tipData.example}</p>
            </div>
          </div>
        );

        return { title, description, section, other: null };
    }

    // 방정식 팁
    if (category === 'math' && subTopic === 'equations') {
      const title = '🧩 방정식 풀이 팁';
      const description = '핵심 로직: "이항(Transposition) = 부호 반대(Change Sign)."';
      
      if (!level) {
        return { title, description, section: null, other: null };
      }

        const tips: Record<number, { title: string; tip: string; example: string; strategy: string }> = {
          1: {
            title: '1레벨: 직관 덧셈',
            tip: '더해서 나왔으니 → 뺀다 (8−3)',
            example: '□+3=8',
            strategy: '결과값에서 더해진 숫자를 덜어내세요.'
          },
          2: {
            title: '2레벨: 직관 뺄셈',
            tip: '뺐는데 남았으니 → 더한다 (10+5)',
            example: '□−5=10',
            strategy: '원래 숫자는 더 컸을 겁니다. 결과값에 뺀 만큼 돌려주세요.'
          },
          3: {
            title: '3레벨: 순서 함정',
            tip: '□와 3의 자리를 체인지 (10−3)',
            example: '10−□=3',
            strategy: '마이너스 빈칸(−□)은 답이랑 자리를 바꾸면 플러스로 변합니다.'
          },
          4: {
            title: '4레벨: 이항 기초 +',
            tip: '+5가 넘어가면 → −5',
            example: 'x+5=12',
            strategy: '등호(=)를 넘어갈 때 옷(부호)을 갈아입는다고 생각하세요.'
          },
          5: {
            title: '5레벨: 이항 기초 -',
            tip: '−7이 넘어가면 → +7',
            example: 'x−7=15',
            strategy: '빼기는 넘어가서 더하기가 됩니다. 그냥 오른쪽 숫자랑 더하세요.'
          },
          6: {
            title: '6레벨: 거울 모드',
            tip: '좌우 반전 상관없음. +8을 넘겨서 → −8',
            example: '20=x+8',
            strategy: 'x가 어디 있든 상관없습니다. x 옆에 있는 녀석만 쫓아내세요.'
          },
          7: {
            title: '7레벨: 계수 나누기',
            tip: 'x에 딱 붙은 숫자는 → 밑(분모)으로 보낸다 (21÷3)',
            example: '3x=21',
            strategy: '딱 붙어있는 건 곱하기입니다. 반대편 숫자를 이걸로 나누세요.'
          },
          8: {
            title: '8레벨: 분수 꼴',
            tip: '밑에 깔린 숫자는 → 올려서 곱한다 (5×4)',
            example: 'x/4=5',
            strategy: '바닥에 있는 숫자는 건너편으로 던져 올려서 곱해주면 됩니다.'
          },
          9: {
            title: '9레벨: 음수 계수',
            tip: '양쪽 부호를 → 동시에 삭제 (x=5)',
            example: '−x=−5',
            strategy: '양쪽에 마이너스가 있으면 둘 다 플러스로 바꿔도 됩니다.'
          },
          10: {
            title: '10레벨: 2단계 표준',
            tip: '덧셈 떼고(−) → 곱셈 떼기(÷)',
            example: '2x+4=14',
            strategy: '(1) 14−4=10 (2) 10÷2=5. 멀리 있는 더하기부터 처리하세요.'
          },
          11: {
            title: '11레벨: 2단계 뺄셈',
            tip: '넘겨서 더하고(+) → 나누기(÷)',
            example: '3x−5=16',
            strategy: '(1) 16+5=21 (2) 21÷3=7. 빼기는 넘겨서 더해주는 것부터 시작입니다.'
          },
          12: {
            title: '12레벨: 큰 수 도전',
            tip: '0 떼고 생각하기. 5x+2=12 처럼 축소.',
            example: '5x+20=120',
            strategy: '숫자가 커도 쫄지 마세요. 이항 → 나눗셈 순서는 절대 변하지 않습니다.'
          },
          13: {
            title: '13레벨: 양변 x',
            tip: '작은 x가 큰 x 쪽으로 이동 → 뺄셈 (3x−x=2x)',
            example: '3x=x+10',
            strategy: 'x는 x끼리 뭉쳐야 합니다. 이사 가면 부호가 바뀐다는 걸 명심하세요.'
          },
          14: {
            title: '14레벨: 괄호 분배',
            tip: '괄호 앞 숫자(2)로 전체(16)를 먼저 나눈다. (x+3=8)',
            example: '2(x+3)=16',
            strategy: '전개하지 마세요! 괄호 밖의 숫자로 반대편을 나눠버리는 게 훨씬 빠릅니다. (정수일 때만 가능)'
          },
          15: {
            title: '15레벨: 혼합 보스',
            tip: 'x는 왼쪽, 숫자는 오른쪽. 끼리끼리 모으기.',
            example: '3x+5=2x+10',
            strategy: '머릿속으로 교통정리를 하세요. 3x−2x 그리고 10−5. 그럼 답은 바로 나옵니다.'
          }
        };

        const tipData = tips[level];
        if (!tipData) {
          return { title, description, section: null, other: null };
        }

        const section = (
          <div className="game-tip-section">
            <h4>{tipData.title}</h4>
            <p><strong>팁:</strong> {tipData.tip}</p>
            <p><strong>공략:</strong> {tipData.strategy}</p>
            <div className="game-tip-example">
              <p><strong>예시:</strong> {tipData.example}</p>
            </div>
          </div>
        );

        return { title, description, section, other: null };
    }

    // 히라가나 팁
    if (category === 'language' && subTopic === 'japanese') {
      const title = '💡 히라가나 표';
      const description = '히라가나를 보고 로마지(영문자)로 입력하세요.';
      
      // 기본 히라가나만 표시 (탁음, 반탁음 제외)
      const basicHiragana = HIRAGANA_MAPPINGS.filter(m => {
        const romaji = m.romaji;
        return romaji.length <= 2; // 기본 문자만
      });

      // 행별로 그룹화 (a, i, u, e, o 순서)
      const rows = ['a', 'i', 'u', 'e', 'o'];
      const consonants = ['k', 's', 't', 'n', 'h', 'm', 'y', 'r', 'w'];
      const grouped: Array<{ row: string; items: typeof basicHiragana }> = [];

      // 모음 행 (a, i, u, e, o)
      rows.forEach(vowel => {
        const items = basicHiragana.filter(m => m.romaji === vowel);
        if (items.length > 0) {
          grouped.push({ row: vowel, items });
        }
      });

      // 자음 행 (ka, ki, ku, ke, ko 등)
      consonants.forEach(consonant => {
        const items = basicHiragana.filter(m => {
          if (m.romaji.length !== 2) return false;
          return m.romaji.startsWith(consonant);
        });
        if (items.length > 0) {
          grouped.push({ row: consonant, items });
        }
      });

      const other = (
        <div className="hiragana-table-container">
          {grouped.map((group, groupIndex) => (
            <div key={groupIndex} className="hiragana-row-group">
              <div className="hiragana-row-header">{group.row.toUpperCase()}행</div>
              <div className="hiragana-row-items">
                {group.items.map((mapping, index) => (
                  <div key={index} className="hiragana-item">
                    <span className="hiragana-char">{mapping.hiragana}</span>
                    <span className="romaji-char">{mapping.romaji}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );

      return { title, description, section: null, other };
    }

    // 기본 팁 (다른 카테고리)
    return {
      title: '💡 게임 팁',
      description: '문제를 빠르고 정확하게 풀어보세요!',
      section: null,
      other: null
    };
  };

  const tipData = getTipData();

  // 세로모드용 전체 콘텐츠 생성
  const renderVerticalContent = () => (
    <div className="game-tip-content">
      <h3 className="game-tip-title">{tipData.title}</h3>
      {tipData.description && <p className="game-tip-description">{tipData.description}</p>}
      {tipData.section}
      {tipData.other}
    </div>
  );

  return (
    <div className="game-tip-modal-overlay" onClick={handleClose} key={orientationKey}>
      <div className="game-tip-modal" onClick={(e) => e.stopPropagation()}>
        <div className="game-tip-content-wrapper">
          {/* 왼쪽 영역 (가로모드에서만 표시) */}
          <div className="game-tip-left-area">
            <h3 className="game-tip-title">{tipData.title}</h3>
            <div className="game-tip-spacer"></div>
            <div className="game-tip-checkbox-container">
              <label className="game-tip-checkbox-label">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="game-tip-checkbox"
                />
                <span>다시 보지 않기</span>
              </label>
            </div>
            <button className="game-tip-close-button" onClick={handleClose}>
              시작하기
            </button>
          </div>
          
          {/* 오른쪽 영역 (가로모드에서만 표시) */}
          <div className="game-tip-right-area">
            {tipData.description && <p className="game-tip-description">{tipData.description}</p>}
            {tipData.section}
            {tipData.other}
          </div>
          
          {/* 세로모드용 전체 콘텐츠 */}
          <div className="game-tip-vertical-content">
            {renderVerticalContent()}
            <div className="game-tip-checkbox-container">
              <label className="game-tip-checkbox-label">
                <input
                  type="checkbox"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="game-tip-checkbox"
                />
                <span>다시 보지 않기</span>
              </label>
            </div>
          </div>
          {/* 세로모드용 시작하기 버튼 (하단 고정) */}
          <button className="game-tip-close-button game-tip-close-button-vertical" onClick={handleClose}>
            시작하기
          </button>
        </div>
      </div>
    </div>
  );
}

