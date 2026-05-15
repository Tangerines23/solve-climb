import { useState } from 'react';
// import { createSafeStorageKey } from '../utils/storageKey'; // Removed
// import { storage } from '../utils/storage'; // Removed
import { BackpackBottomSheet } from './BackpackBottomSheet';
import { BaseModal } from '@/components/BaseModal';
import './GameTipModal.css';

interface GameTipModalProps {
  isOpen: boolean;
  category: string;
  subTopic: string;
  level?: number | null;
  onClose: () => void;
  onStart: (selectedItemIds: number[]) => void;
}

export function GameTipModal({ isOpen, category, level, onStart, onClose }: GameTipModalProps) {
  // const [doNotShowAgain, setDoNotShowAgain] = useState(false); // Removed
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  if (!isOpen) {
    return null;
  }

  // start handler removed, using inline onStart

  const toggleItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const getTipData = () => {
    // Math Mountain Tips
    if (category === '기초' || category === '대수' || category === '논리' || category === '심화') {
      let title = '게임 팁';
      let icon = '💡';
      let description = '문제를 빠르고 정확하게 풀어보세요!';
      let tips: Record<string, { title: string; tip: string; example: string; strategy: string }> =
        {};

      if (category === '기초') {
        title = '사칙연산 팁';
        icon = '🧮';
        description = '핵심 로직: "숫자를 쪼개거나(Split), 10을 만들어라(Make 10)."';
        tips = {
          1: {
            title: '1레벨: 반사신경 덧셈',
            tip: '계산 금지. 이미지를 떠올리세요.',
            example: '3+4=?',
            strategy: '숫자를 보자마자 구구단 외우듯 답을 찍으세요.',
          },
          2: {
            title: '2레벨: 뺄셈의 기본',
            tip: '덧셈의 반대! 채워넣기를 하세요.',
            example: '9-5=?',
            strategy: '5에 무엇을 더해야 9가 될지 생각해보세요.',
          },
          3: {
            title: '3레벨: 10 만들기 (Make 10)',
            tip: '두 숫자를 합쳐 10을 먼저 만세요.',
            example: '8+5=?',
            strategy: '8에게 2를 빌려줘서 10을 만들고, 남은 3을 더하세요. (13)',
          },
          4: {
            title: '4레벨: 받아내림 뺄셈',
            tip: '10을 빌려와서 뻬세요.',
            example: '15-7=?',
            strategy: '10에서 7을 먼저 빼면 3, 거기에 5를 더하세요.',
          },
          5: {
            title: '5레벨: 구구단 (곱셈)',
            tip: '구구단을 노래처럼 외우세요.',
            example: '7x8=?',
            strategy: '7, 14, 21... 손가락 세지 말고 바로 튀어나와야 합니다!',
          },
          6: {
            title: '6레벨: 나눗셈 (역연산)',
            tip: '곱셈을 거꾸로 생각하세요.',
            example: '42÷6=?',
            strategy: '6단에서 무엇을 곱해야 42가 나오나요? 정답은 7!',
          },
          7: {
            title: '7레벨: 혼합 계산 1',
            tip: '곱셈/나눗셈 먼저! 괄호 먼저!',
            example: '3+5x2=?',
            strategy: '5x2=10을 먼저 하고 3을 더하세요. 순서가 생명입니다.',
          },
          8: {
            title: '8레벨: 두 자리 곱셈',
            tip: '분배 법칙: 쪼개서 곱하세요.',
            example: '12x4=?',
            strategy: '10x4=40, 2x4=8. 합치면 48! 머릿속으로 쪼개세요.',
          },
          9: {
            title: '9레벨: 나머지 있는 나눗셈',
            tip: '가장 가까운 구구단을 찾으세요.',
            example: '50÷7=?',
            strategy: '7x7=49. 50에서 49를 빼면 1. 몫은 7, 나머지는 1.',
          },
          10: {
            title: '10레벨: 사칙연산 마스터',
            tip: '침착함이 무기입니다.',
            example: '(3+7)x5-4=?',
            strategy: '괄호(10) → 곱하기(50) → 빼기(4). 흐름을 타세요!',
          },
          11: {
            title: '11레벨: 두 걸음씩',
            tip: '두 자릿수 덧셈, 받아올림이 없어요.',
            example: '12 + 15 = ?',
            strategy: '십의 자리끼리, 일의 자리끼리 더하세요.',
          },
          12: {
            title: '12레벨: 무거운 배낭',
            tip: '받아올림이 있는 두 자릿수 덧셈',
            example: '18 + 24 = ?',
            strategy: '일의 자리 합이 10을 넘으면 십의 자리에 1을 더해주세요.',
          },
          13: {
            title: '13레벨: 세 개의 돌탑',
            tip: '3항 연산, 순서대로 하세요.',
            example: '10 - 3 + 5 = ?',
            strategy: '앞에서부터 차근차근. 서두르지 마세요.',
          },
          14: {
            title: '14레벨: 곱하기 우선',
            tip: '덧셈보다 곱셈이 먼저입니다!',
            example: '3 + 2 x 4 = ?',
            strategy: '★주의: 2x4를 먼저 하고 3을 더하세요.',
          },
          15: {
            title: '15레벨: 암산왕',
            tip: '중간 계산 값을 기억하세요.',
            example: '복합 연산',
            strategy: '암산력을 테스트하는 구간입니다. 집중!',
          },
          16: {
            title: '16레벨: 괄호의 벽',
            tip: '괄호 안이 1순위입니다.',
            example: '2 x (3 + 4) = ?',
            strategy: '무조건 괄호부터! 그 다음 곱셈을 하세요.',
          },
          17: {
            title: '17레벨: 큰 수의 위압감',
            tip: '100에서 빌려오기',
            example: '100 - 35 = ?',
            strategy: '90에서 30을 빼고, 10에서 5를 빼면 쉬워요.',
          },
          18: {
            title: '18레벨: 나머지 길',
            tip: '몫이 아닌 남는 수를 쓰세요.',
            example: '14 ÷ 3의 나머지',
            strategy: '3, 6, 9, 12... 14에서 12를 빼면 남는 건 2!',
          },
          19: {
            title: '19레벨: 빈칸 맛보기',
            tip: '거꾸로 계산하는 대수 예고편',
            example: '□ + 5 = 12',
            strategy: '5에 무엇을 더해야 12가 될지(12-5) 생각하세요.',
          },
          20: {
            title: '20레벨: 정수 마스터',
            tip: '모든 정수 연산의 총정리',
            example: '종합 사칙연산',
            strategy: '실수 없이 정확하게 푸는 것이 중요합니다.',
          },
          21: {
            title: '21레벨: 쪼개진 돌 (소수)',
            tip: '소수점 위치를 맞추세요.',
            example: '0.1 + 0.2 = ?',
            strategy: '일반 덧셈처럼 계산하고 소수점만 찍어주세요.',
          },
          22: {
            title: '22레벨: 소수의 뺄셈',
            tip: '내림은 똑같습니다.',
            example: '1.5 - 0.8 = ?',
            strategy: '15-8=7, 소수점을 찍어 0.7!',
          },
          23: {
            title: '23레벨: 정수 만들기',
            tip: '합쳐서 1이 되는 관계',
            example: '0.4 + 0.6 = 1',
            strategy: '결과가 딱 떨어지는 기쁨을 느껴보세요.',
          },
          24: {
            title: '24레벨: 반 조각 (분수)',
            tip: '분모가 같으면 분자만 더해요.',
            example: '1/3 + 1/3 = ?',
            strategy: '분모는 그대로 두고 위의 숫자만 더하세요.',
          },
          25: {
            title: '25레벨: 캠프 (소수/분수)',
            tip: '소수와 분수의 혼합 적응',
            example: '0.5 + 1/2 = ?',
            strategy: '둘 중 하나로 통일해서 생각하면 쉬워요.',
          },
          26: {
            title: '26레벨: 피자 나누기',
            tip: '자연수에서 분수 빼기',
            example: '1 - 1/4 = ?',
            strategy: '1을 4/4로 생각해서 빼보세요.',
          },
          27: {
            title: '27레벨: 쉬운 통분',
            tip: '분모를 똑같이 맞추세요.',
            example: '1/2 + 1/4 = ?',
            strategy: '1/2을 2/4로 바꾸면 계산이 가능해집니다.',
          },
          28: {
            title: '28레벨: 작아지는 곱',
            tip: '1보다 작은 수를 곱하면 작아져요.',
            example: '10 x 0.1 = ?',
            strategy: '열 조각 중 한 조각을 가져가는 셈입니다.',
          },
          29: {
            title: '29레벨: 나누기의 변신',
            tip: '0.5로 나누는 건 2를 곱하는 것!',
            example: '3 ÷ 0.5 = ?',
            strategy: '3 안에 0.5가 몇 번 들어가는지 생각하세요.',
          },
          30: {
            title: '30레벨: 계산의 신',
            tip: '수리봉 정상에 오를 자격 증명',
            example: '최종 타임어택',
            strategy: '망설임 없는 연산이 승리의 열쇠입니다.',
          },
        };
      } else if (category === '대수') {
        title = '방정식 풀이 팁';
        icon = '🧩';
        description = '핵심 로직: "이항(Transposition) = 부호 반대(Change Sign)."';
        tips = {
          1: {
            title: '1레벨: 직관 방정식',
            tip: '더해서 나왔으니 → 뺀다',
            example: '□+3=8',
            strategy: '결과값(8)에서 더해진 숫자(3)를 덜어내세요. 정답 5.',
          },
          2: {
            title: '2레벨: 뺄셈 방정식',
            tip: '빠진 조각 찾기',
            example: '10-□=4',
            strategy: '10에서 4를 빼보세요. 둘은 자리를 바꿀 수 있습니다.',
          },
          3: {
            title: '3레벨: 이항 (Transposition)',
            tip: '이사 가면 부호가 바뀝니다.',
            example: '2x+1=5',
            strategy: '+1이 넘어가면 -1이 됩니다. 2x=4, x=2!',
          },
          4: {
            title: '4레벨: 곱셈/나눗셈 역연산',
            tip: '곱하기는 나누기로 부수세요.',
            example: '3x=21',
            strategy: '양쪽을 3으로 나누세요. x=7.',
          },
          5: {
            title: '5레벨: 복합 방정식',
            tip: '덧셈/뺄셈부터 정리하세요.',
            example: '2x-4=6',
            strategy: '-4를 먼저 넘겨서 +4로 만드세요. 2x=10.',
          },
          6: {
            title: '6레벨: 괄호 방정식',
            tip: '분배법칙으로 괄호를 푸세요.',
            example: '2(x+1)=8',
            strategy: '2x+2=8로 만들기. 또는 양변을 2로 나누기.',
          },
          7: {
            title: '7레벨: 분수 방정식',
            tip: '분모를 없애는 게 빠릅니다.',
            example: 'x/2 + 1 = 3',
            strategy: '모든 항에 2를 곱해버리세요! x + 2 = 6.',
          },
          8: {
            title: '8레벨: 양변에 미지수',
            tip: '끼리끼리 모으세요.',
            example: '2x+1 = x+5',
            strategy: 'x는 왼쪽으로, 숫자는 오른쪽으로 이사!',
          },
          9: {
            title: '9레벨: 소수점이 있는 방정식',
            tip: '10을 곱해서 정수로 만드세요.',
            example: '0.2x = 1',
            strategy: '양변에 10을 곱하면 2x=10. 훨씬 쉽죠?',
          },
          10: {
            title: '10레벨: 방정식 마스터',
            tip: '검산하는 습관을 들이세요.',
            example: '복잡한 식',
            strategy: '구한 답을 원래 식에 넣어보세요. 맞다면 그게 정답!',
          },
          11: {
            title: '11레벨: 상수 이항',
            tip: '등호를 넘으면 부호가 반대!',
            example: 'x + 5 = 12',
            strategy: '+5를 넘겨서 -5로 바꾸세요. x=7.',
          },
          12: {
            title: '12레벨: 부호 변환',
            tip: '빼기는 더하기로 변신',
            example: 'x - 3 = 7',
            strategy: '-3이 이항하면 +3이 됩니다. x=10.',
          },
          13: {
            title: '13레벨: 변수 이항',
            tip: 'x도 이사할 수 있어요.',
            example: '2x = x + 5',
            strategy: '오른쪽 x를 왼쪽으로 넘겨서 2x-x=5로 만드세요.',
          },
          14: {
            title: '14레벨: 괄호 풀기',
            tip: '안을 먼저 풀거나 통째로 나누기',
            example: '2(x+1) = 8',
            strategy: '2로 먼저 나누거나(x+1=4), 분배법칙(2x+2=8)을 쓰세요.',
          },
          15: {
            title: '15레벨: 이항 마스터 (Boss)',
            tip: '이항의 원리를 완벽히 파악하세요.',
            example: '혼합 방정식',
            strategy: '드래그 효과(예정)를 상상하며 부호를 바꿔보세요.',
          },
          16: {
            title: '16레벨: 비례식 (Algebra)',
            tip: '내항의 곱 = 외항의 곱',
            example: '1:2 = 3:x',
            strategy: '안쪽끼리(2x3), 바깥쪽끼리(1x) 곱한 값이 같습니다.',
          },
          17: {
            title: '17레벨: 대입법',
            tip: 'y 대신 그 값을 넣으세요.',
            example: 'y=x+2, y=5',
            strategy: 'x+2=5가 됩니다. 연립방정식의 기초죠.',
          },
          18: {
            title: '18레벨: 부등식 기초',
            tip: '범위에 맞는 "가장 작은 정수"',
            example: 'x > 3',
            strategy: '3보다 큰 정수 중 가장 작은 수는 4입니다.',
          },
          19: {
            title: '19레벨: 부등식 풀기',
            tip: '이항 규칙은 방정식과 같습니다.',
            example: '2x > 10',
            strategy: 'x > 5가 되므로, 만족하는 정수는 6입니다.',
          },
          20: {
            title: '20레벨: 대수왕 (Final)',
            tip: '식의 구조를 꿰뚫어보세요.',
            example: '종합 대수 문제',
            strategy: '변수와 상수를 분리하는 게 핵심입니다.',
          },
        };
      } else if (category === '논리') {
        title = '논리 수학 팁';
        icon = '🧠';
        description = '핵심 로직: "패턴을 찾고 규칙을 적용하세요."';
        tips = {
          1: {
            title: '1레벨: 홀수와 짝수',
            tip: '2로 나누어 떨어지면 짝수!',
            example: '3, 5, 7...',
            strategy: '끝자리가 1,3,5,7,9면 홀수, 0,2,4,6,8이면 짝수입니다.',
          },
          2: {
            title: '2레벨: 양수와 음수',
            tip: '0보다 작으면 음수(-)',
            example: '-5 vs 3',
            strategy: '수직선을 상상하세요. 오른쪽이 큽니다. 음수는 숫자가 클수록 작습니다.',
          },
          3: {
            title: '3레벨: 등차수열',
            tip: '일정한 차이를 찾으세요.',
            example: '2, 4, 6, ?',
            strategy: '앞뒤 숫자의 차이를 구해보세요. +2씩 커지고 있나요? 정답은 8!',
          },
          4: {
            title: '4레벨: 등비수열',
            tip: '일정한 비율(곱하기)을 찾으세요.',
            example: '2, 4, 8, ?',
            strategy: 'x2씩 커지고 있습니다. 8x2=16.',
          },
          5: {
            title: '5레벨: 피보나치',
            tip: '앞의 두 수를 더하세요.',
            example: '1, 1, 2, 3, 5, ?',
            strategy: '3+5=8. 자연의 법칙입니다.',
          },
          6: {
            title: '6레벨: 소수(Prime)',
            tip: '약수가 1과 자신뿐인 수.',
            example: '2, 3, 5, 7...',
            strategy: '짝수는 2를 제외하고 소수가 아닙니다. 3, 5, 7로 나누어지는지 확인하세요.',
          },
          7: {
            title: '7레벨: 나머지 연산',
            tip: '나눗셈의 나머지만 보세요.',
            example: '10 mod 3',
            strategy: '10을 3으로 나누면 몫은 3, 나머지는 1. 정답은 1.',
          },
          8: {
            title: '8레벨: 팩토리얼(!)',
            tip: '1부터 그 수까지 곱하세요.',
            example: '3!',
            strategy: '3x2x1 = 6. 숫자가 순식간에 커집니다.',
          },
          9: {
            title: '9레벨: 시계 규칙',
            tip: '12시는 0시와 같습니다.',
            example: '13시 = 1시',
            strategy: '12로 나눈 나머지를 생각하세요.',
          },
          10: {
            title: '10레벨: 논리 퀴즈',
            tip: '문제 속에 답이 있습니다.',
            example: '규칙 찾기',
            strategy: '당황하지 말고 수열의 변화를 관찰하세요.',
          },
          11: {
            title: '11레벨: 오늘의 약속 - 절댓값',
            tip: '|-5| = 5. 부호를 떼고 크기만 보세요.',
            example: '|-7| = 7',
            strategy: '멀리 있는 정도만 생각하세요. 마이너스는 무시!',
          },
          12: {
            title: '12레벨: 오늘의 약속 - 나머지(Mod)',
            tip: '나눈 후 남는 조각만 찾으세요.',
            example: '14 mod 3 = 2',
            strategy: '3, 6, 9, 12... 다 가고 남은 2가 정답입니다.',
          },
          13: {
            title: '13레벨: 오늘의 약속 - 팩토리얼(!)',
            tip: '1부터 n까지 몽땅 곱하세요.',
            example: '3! = 3x2x1 = 6',
            strategy: '숫자가 매우 빨리 커집니다. 암산에 집중하세요!',
          },
          14: {
            title: '14레벨: 오늘의 약속 - 사용자 연산',
            tip: '기호가 시키는 대로 대입하세요.',
            example: 'A ★ B = A+B+1',
            strategy: '새로운 규칙도 결국 덧셈/뺄셈입니다. 대입이 핵심!',
          },
          15: {
            title: '15레벨: 논리왕 (Boss)',
            tip: '모든 규칙이 섞여 나옵니다.',
            example: '팩토리얼 + 나머지',
            strategy: '문제를 읽는 속도가 생명입니다. 당황금지!',
          },
        };
      } else if (category === '심화') {
        title = '고급 수학 팁';
        icon = '📈';
        description = '핵심 로직: "함수의 변화와 기울기를 이해하세요."';
        tips = {
          1: {
            title: '1레벨: 함숫값',
            tip: 'x 자리에 숫자를 넣으세요.',
            example: 'f(x)=2x, f(3)=?',
            strategy: 'x 대신 3을 넣으면 2x3=6.',
          },
          2: {
            title: '2레벨: 지수 법칙',
            tip: '곱하면 더하고, 나누면 뺍니다.',
            example: '2^3 x 2^2',
            strategy: '지수끼리 더하세요. 3+2=5. 정답 2^5(32).',
          },
          3: {
            title: '3레벨: 미분 기초',
            tip: '차수를 내리고 하나 줄이세요.',
            example: 'x^2 미분',
            strategy: '2가 앞으로 나오고 지수는 1이 됨. 결과 2x.',
          },
          4: {
            title: '4레벨: 삼각함수',
            tip: 'sin 미분은 cos',
            example: 'd/dx sin(x)',
            strategy: 'sin -> cos, cos -> -sin. 부호를 조심하세요.',
          },
          5: {
            title: '5레벨: 극한(Limit)',
            tip: '어디로 다가가는지 보세요.',
            example: '1/x (x->∞)',
            strategy: '분모가 엄청 커지면 전체는 0에 가까워집니다.',
          },
          6: {
            title: '6레벨: 적분 기초',
            tip: '미분의 반대 과정입니다.',
            example: '∫ 2x dx',
            strategy: '미분해서 2x가 되는 건? x^2 + C.',
          },
          7: {
            title: '7레벨: 기울기',
            tip: 'x증가량 분의 y증가량',
            example: '(0,0) -> (2,4)',
            strategy: '4/2 = 2. 기울기는 2입니다.',
          },
          8: {
            title: '8레벨: 극대/극소',
            tip: '미분해서 0이 되는 지점',
            example: "f'(x)=0",
            strategy: '접선의 기울기가 0인 곳이 봉우리나 골짜기입니다.',
          },
          9: {
            title: '9레벨: 합성함수',
            tip: '겉미분 x 속미분',
            example: '(2x)^2 미분',
            strategy: '전체 미분 후 안쪽(2x) 미분값 2를 곱하세요.',
          },
          10: {
            title: '10레벨: 공학 수학',
            tip: '모든 개념의 응용입니다.',
            example: '복합 문제',
            strategy: '단순화해서 하나씩 해결하세요.',
          },
          11: {
            title: '11레벨: 상수 미분',
            tip: '숫자만 있으면 미분 시 0!',
            example: 'd/dx (5) = 0',
            strategy: '상수는 변화가 없으므로 기울기도 0입니다.',
          },
          12: {
            title: '12레벨: 삼각함수 파티',
            tip: '전환 규칙을 암기하세요.',
            example: 'sin -> cos, cos -> -sin',
            strategy: '부호가 붙는 cos 미분을 주의하세요.',
          },
          13: {
            title: '13레벨: 차수 올리기 (적분)',
            tip: '지수에 1을 더하고 그 수로 나누세요.',
            example: '∫ 3x^2 dx = x^3',
            strategy: '미분의 거꾸로! 파란색 테두리를 확인하세요.',
          },
          14: {
            title: '14레벨: 단순 적분',
            tip: '계수와 지수의 조화',
            example: '∫ 2x dx = x^2',
            strategy: '지수(1)에 1 더해서 2, 2로 나누면 계수 사라짐.',
          },
          15: {
            title: '15레벨: 미적분 마스터 (Max)',
            tip: '색상을 보고 연산 종류를 판단하세요.',
            example: '미분(빨강) vs 적분(파랑)',
            strategy: '순발력과 정확도 모두 필요합니다. 정상을 정복하세요!',
          },
        };
      }

      const levelTip = tips[level || 1] || tips[1]; // Fallback if level is null or out of range

      if (!level) return { title, icon, description, section: null, other: null };

      const section = (
        <div className="level-tip-card" data-vg-ignore="true">
          <h4 className="level-tip-title">{levelTip.title}</h4>
          <p className="level-tip-text" data-vg-ignore="true">
            <strong>팁:</strong> {levelTip.tip}
          </p>
          {levelTip.strategy && (
            <p className="level-tip-strategy" data-vg-ignore="true">
              <strong>공략:</strong> {levelTip.strategy}
            </p>
          )}
          <div className="level-tip-example" data-vg-ignore="true">
            <span>예시: {levelTip.example}</span>
          </div>
        </div>
      );

      return { title, icon, description, section, other: null };
    }

    if (category === '히라가나') {
      // Japanese tips...
      return {
        title: '히라가나 표',
        icon: '💡',
        description: '히라가나를 보고 로마지(영문자)로 입력하세요.',
        section: null,
        other: <div className="hiragana-mini-table">...</div>,
      };
    }

    return {
      title: '게임 팁',
      icon: '💡',
      description: '문제를 빠르고 정확하게 풀어보세요!',
      section: null,
      other: null,
    };
  };

  const tipData = getTipData();

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      showOverlay={true}
      closeOnOverlayClick={true}
      title={null} // Custom layout used inside children
      className="gt-modal-container"
    >
      <div className="gt-layout-wrapper">
        {/* Left Side: Title & Controls */}
        <div className="gt-left-panel">
          <div className="gt-title-area">
            <span className="gt-title-icon">{tipData.icon}</span>
            <h3 className="gt-title-text" data-testid="gt-title-text">
              {tipData.title}
            </h3>
          </div>

          <div className="gt-controls-area" data-vg-ignore="true">
            <div
              className="gt-checkbox-label"
              onClick={onClose}
              style={{ cursor: 'pointer', display: 'inline-flex' }}
            >
              <span>← 뒤로</span>
            </div>

            <div className="gt-button-group" data-vg-ignore="true">
              <button
                className="btn-base btn-primary gt-start-btn"
                data-testid="gt-start-btn"
                onClick={() => onStart(selectedItemIds)}
                data-vg-ignore="true"
              >
                시작하기
              </button>
              <button className="gt-backpack-btn" onClick={() => setIsBackpackOpen(true)}>
                🎒
                {selectedItemIds.length > 0 && (
                  <span className="gt-badge">{selectedItemIds.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Tip Content */}
        <div className="gt-right-panel">
          <div className="gt-description">{tipData.description}</div>
          <div className="gt-scroll-content">
            {tipData.section}
            {tipData.other}
          </div>
        </div>
      </div>

      <BackpackBottomSheet
        isOpen={isBackpackOpen}
        onClose={() => setIsBackpackOpen(false)}
        selectedItemIds={selectedItemIds}
        onToggleItem={toggleItem}
      />
    </BaseModal>
  );
}
