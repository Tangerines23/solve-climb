import { useState } from 'react';
// import { createSafeStorageKey } from '../utils/storageKey'; // Removed
// import { storage } from '../utils/storage'; // Removed
import { BackpackBottomSheet } from './game/BackpackBottomSheet';
import { BaseModal } from './BaseModal';
import './GameTipModal.css';

interface GameTipModalProps {
  isOpen: boolean;
  category: string;
  subTopic: string;
  level?: number | null;
  onClose: () => void;
  onStart: (selectedItemIds: number[]) => void;
}

export function GameTipModal({ isOpen, category, subTopic, level, onStart, onClose }: GameTipModalProps) {
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
        if (subTopic === 'World2') {
          title = '도형과 공간 팁';
          icon = '📐';
          description = '공식과 대칭 규칙을 활용하세요.';
          tips = {
            1: {
              title: '1레벨: 기초 도형',
              tip: '꼭짓점과 변의 개수',
              example: '삼각형의 꼭짓점 개수는? -> 3',
              strategy: '도형의 이름에 답이 있습니다.',
            },
            2: {
              title: '2레벨: 다각형 대각선',
              tip: '대각선의 개수',
              example: '오각형의 대각선 개수는? -> 5',
              strategy: '공식: n(n-3)/2 (사각형:2, 오각형:5, 육각형:9, 칠각형:14, 팔각형:20)',
            },
            3: {
              title: '3레벨: 삼각형의 성질',
              tip: '내각의 크기 합은 180도',
              example: '두 내각이 50도, 60도일 때 -> 나머지 한 각은 70도',
              strategy: '180에서 알고 있는 두 각의 크기를 빼세요.',
            },
            4: {
              title: '4레벨: 사각형의 성질',
              tip: '평행사변형의 각도',
              example: '한 각이 60도일 때 -> 이웃한 각은 120도, 마주보는 각은 60도',
              strategy: '이웃한 각의 합은 180도, 마주보는 각의 크기는 서로 같습니다.',
            },
            5: {
              title: '5레벨: 직사각형 넓이',
              tip: '가로 x 세로',
              example: '가로 5, 세로 4 -> 넓이 20',
              strategy: '두 변의 길이를 곱하세요.',
            },
            6: {
              title: '6레벨: 삼각형 넓이',
              tip: '밑변 x 높이 / 2',
              example: '밑변 8, 높이 5 -> 넓이 20',
              strategy: '밑변과 높이를 곱한 값을 2로 나눕니다. 밑변은 항상 짝수로 제공되어 떨어집니다.',
            },
            7: {
              title: '7레벨: 원의 기초',
              tip: '지름 = 반지름 x 2',
              example: '반지름 6 -> 지름 12',
              strategy: '반지름에 2를 곱하면 지름이 됩니다.',
            },
            8: {
              title: '8레벨: 원의 둘레와 넓이',
              tip: '원주율 = 3.1 연산',
              example: '반지름 3 -> 둘레 18.6 / 반지름 5 -> 넓이 77.5',
              strategy: '원주율 3.1을 곱해 계산합니다. 소수 한 자리 곱셈으로 출제되며, 6.2 * 반지름 혹은 3.1 * 반지름²으로 생각하면 계산하기 쉽습니다.',
            },
            9: {
              title: '9레벨: 대칭축 기초',
              tip: '정다각형의 대칭축 개수',
              example: '정오각형 -> 대칭축 5개',
              strategy: '정n각형의 선대칭축 개수는 n개입니다.',
            },
            10: {
              title: '10레벨: 피타고라스 기초',
              tip: '직각삼각형의 변의 길이',
              example: '변 3, 4 -> 빗변 5',
              strategy: '자주 쓰이는 피타고라스 수의 비율(3:4:5, 5:12:13, 8:15:17)을 암기하면 계산이 빠릅니다.',
            },
            11: {
              title: '11레벨: 피타고라스 심화',
              tip: '더 큰 직각삼각형 변의 길이',
              example: '변 7, 24 -> 빗변 25',
              strategy: '심화 피타고라스 수(7:24:25, 9:40:41, 11:60:61)도 눈에 익혀두면 루트 계산이 필요 없습니다.',
            },
            12: {
              title: '12레벨: 입체도형 기본',
              tip: '꼭짓점, 면, 모서리',
              example: '오각기둥 모서리 개수 -> 15개',
              strategy: 'n각기둥 모서리는 3n개, n각뿔 꼭짓점은 n+1개 규칙을 적용하세요.',
            },
            13: {
              title: '13레벨: 입체도형 부피',
              tip: '직육면체와 원기둥의 부피',
              example: '반지름 2, 높이 3 원기둥 -> 3.1 * 4 * 3 = 37.2',
              strategy: '원기둥 부피 계산 시 원주율 3.1을 사용합니다. 밑넓이(3.1 * r²)에 높이를 곱하며, 최종 결과는 항상 정수 또는 소수 한 자리로 정밀하게 떨어집니다.',
            },
            14: {
              title: '14레벨: 입체도형 겉넓이',
              tip: '정육면체의 겉넓이',
              example: '한 변이 5 -> 겉넓이 6x25 = 150',
              strategy: '정육면체는 넓이가 같은 정사각형 6개로 이루어져 있습니다. (6 x s²)',
            },
          };
        } else if (subTopic === 'World3') {
          title = '확률과 통계 팁';
          icon = '📊';
          description = '평균과 경우의 수 규칙을 활용하세요.';
          tips = {
            1: {
              title: '1레벨: 평균 구하기',
              tip: '세 수의 평균',
              example: '14, 18, 16 -> 평균 16',
              strategy: '세 수를 모두 더한 후 3으로 나눕니다. 합이 항상 3의 배수가 되도록 제공됩니다.',
            },
            2: {
              title: '2레벨: 평균 확장',
              tip: '네 수의 평균',
              example: '10, 12, 14, 16 -> 평균 13',
              strategy: '네 수를 더해 4로 나눕니다. 역시 결과는 무조건 정수로 떨어집니다.',
            },
            3: {
              title: '3레벨: 중앙값 찾기',
              tip: '크기 순서대로 정렬',
              example: '15, 3, 9 -> 중앙값 9',
              strategy: '숫자들을 크기 순으로 나열했을 때 가장 가운데에 위치한 값을 고릅니다.',
            },
            4: {
              title: '4레벨: 최빈값 찾기',
              tip: '가장 자주 나오는 수',
              example: '3, 5, 5, 8 -> 최빈값 5',
              strategy: '가장 여러 번 나타나는 값을 선택합니다.',
            },
            5: {
              title: '5레벨: 범위(Range)',
              tip: '최댓값 - 최솟값',
              example: '12, 5, 43, 20 -> 범위 43 - 5 = 38',
              strategy: '가장 큰 수에서 가장 작은 수를 뺍니다.',
            },
            6: {
              title: '6레벨: 동전 던지기',
              tip: '동전 던지기 경우의 수',
              example: '동전 3개 -> 경우의 수 8',
              strategy: '동전 1개당 2가지 경우가 생기므로, n개면 2^n 가지 경우의 수가 존재합니다.',
            },
            7: {
              title: '7레벨: 가위바위보',
              tip: '가위바위보 경우의 수',
              example: '3명 가위바위보 -> 경우의 수 27',
              strategy: '1인당 3가지 경우가 가능하므로, n명이면 3^n 가지 경우의 수가 존재합니다.',
            },
            8: {
              title: '8레벨: 주사위 던지기',
              tip: '두 주사위 눈의 합 경우의 수',
              example: '눈의 합이 8인 경우 -> 5가지',
              strategy: '주사위 합 S의 경우의 수는 대칭 규칙인 6 - |S-7| 로 빠르게 계산 가능합니다.',
            },
            9: {
              title: '9레벨: 대표 뽑기(조합)',
              tip: '기초 조합 nC2',
              example: '5명 중 대표 2명 -> 10가지',
              strategy: '공식: n*(n-1)/2. 순서와 상관없이 뽑는 경우의 수입니다.',
            },
            10: {
              title: '10레벨: 순열(나열하기)',
              tip: '순열과 팩토리얼',
              example: '4명을 한 줄로 세우기 -> 24가지',
              strategy: '순서를 고려해 세우는 경우의 수로, n명을 나열하면 n! 입니다.',
            },
            11: {
              title: '11레벨: 확률의 기초',
              tip: '백분율 확률 환산',
              example: '5개 중 당첨 2개 -> 40%',
              strategy: '(원하는 경우 / 전체 경우) x 100을 계산하여 백분율(%) 정수 값으로 답하세요.',
            },
            12: {
              title: '12레벨: 확률의 응용',
              tip: '여사건의 확률',
              example: '전체 10개 중 불량 3개일 때 정상일 확률 -> 70%',
              strategy: '전체 100%에서 일어나지 않을 확률(여사건)을 빼서 계산하면 편리합니다.',
            },
            13: {
              title: '13레벨: 확률의 연산',
              tip: '독립사건의 곱과 덧셈',
              example: '동전 앞면과 주사위 홀수 눈 -> 50% x 50% = 25%',
              strategy: '두 사건이 동시에 일어날 확률은 각각의 확률을 곱해줍니다.',
            },
            14: {
              title: '14레벨: 비복원 경우의 수',
              tip: '다시 돌려놓지 않음',
              example: '빨간 공 5개 중 차례로 2개 뽑기 -> 5x4 = 20가지',
              strategy: '첫 번째 선택지는 n개, 두 번째 선택지는 하나가 줄어든 n-1개이므로 n*(n-1)입니다.',
            },
            15: {
              title: '15레벨: 비복원 결합확률',
              tip: '비복원 연속 추출 확률',
              example: '3빨, 2파 중 2개 모두 빨간 공 확률 -> 3/5 x 2/4 = 30%',
              strategy: '첫 번째 사건의 확률에, 첫 번째 공을 뺀 상태의 두 번째 사건 확률을 곱합니다.',
            },
          };
        } else if (subTopic === 'World4') {
          title = '공학 및 응용 팁';
          icon = '💻';
          description = '2진법과 논리 게이트 규칙을 활용하세요.';
          tips = {
            1: {
              title: '1레벨: 2진수 -> 10진수',
              tip: '이진법 변환',
              example: '2진수 1101 -> 10진수 13',
              strategy: '각 자리의 가중치(8, 4, 2, 1)를 활성화된 비트(1)에만 더해줍니다.',
            },
            2: {
              title: '2레벨: 10진수 -> 2진수',
              tip: '이진법 역변환',
              example: '10진수 10 -> 2진수 1010',
              strategy: '10진수 값에서 가중치(8, 4, 2, 1)를 빼보며 1과 0을 채우세요. (10 = 8+2)',
            },
            3: {
              title: '3레벨: 16진수 기초',
              tip: '헥사 코드 이해',
              example: '16진수 1A -> 10진수 26',
              strategy: 'A~F는 10~15를 뜻하며, 자리수가 올라갈 때마다 16의 거듭제곱을 곱합니다.',
            },
            4: {
              title: '4레벨: 논리 게이트 AND',
              tip: '논리곱 AND',
              example: '1 AND 0 -> 0',
              strategy: '두 입력이 모두 1일 때만 결과가 1이 됩니다.',
            },
            5: {
              title: '5레벨: 논리 게이트 OR',
              tip: '논리합 OR',
              example: '1 OR 0 -> 1',
              strategy: '두 입력 중 하나라도 1이면 결과가 1이 됩니다.',
            },
            6: {
              title: '6레벨: 논리 게이트 NOT',
              tip: '부정 NOT',
              example: 'NOT 1 -> 0',
              strategy: '입력값을 거꾸로 반전시킵니다. (1은 0으로, 0은 1로)',
            },
            7: {
              title: '7레벨: 논리 게이트 XOR',
              tip: '배타적 논리합 XOR',
              example: '1 XOR 1 -> 0',
              strategy: '두 입력값이 서로 다를 때만 1이 됩니다.',
            },
            8: {
              title: '8레벨: 메모리 단위 기본',
              tip: 'Byte와 KB 환산',
              example: '4096 바이트 -> 4 KB',
              strategy: '1 KB는 1024 Byte입니다. 1024의 배수를 생각하세요.',
            },
            9: {
              title: '9레벨: 메모리 단위 심화',
              tip: 'KB와 MB 환산',
              example: '2048 KB -> 2 MB',
              strategy: '1 MB는 1024 KB입니다. 1024의 배수 단위를 나눕니다.',
            },
            10: {
              title: '10레벨: 자료구조 스택',
              tip: 'LIFO (Last-In, First-Out)',
              example: 'push(5), push(3), pop() -> 남은 것 5',
              strategy: '마지막에 들어온 원소가 가장 먼저 나갑니다. 책을 쌓아 올리는 구조를 생각하세요.',
            },
            11: {
              title: '11레벨: 자료구조 큐',
              tip: 'FIFO (First-In, First-Out)',
              example: 'enqueue(5), enqueue(3), dequeue() -> 남은 것 3',
              strategy: '먼저 들어온 원소가 먼저 나갑니다. 줄을 서서 기다리는 구조를 생각하세요.',
            },
            12: {
              title: '12레벨: 보수법 - 1의 보수',
              tip: '비트 반전 연산',
              example: '0101의 1의 보수 -> 1010',
              strategy: '이진수의 모든 비트를 반전(0은 1로, 1은 0으로)시킵니다.',
            },
            13: {
              title: '13레벨: 보수법 - 2의 보수',
              tip: '실제 음수 비트 표현',
              example: '0110의 2의 보수 -> 1010',
              strategy: '1의 보수(비트 반전) 결과에 마지막으로 1을 더해줍니다.',
            },
            14: {
              title: '14레벨: 2진수의 덧셈',
              tip: '이진수 캐리 연산',
              example: '011 + 010 -> 101',
              strategy: '각 비트별로 더하되, 1 + 1이 되면 윗자리로 1을 올려(Carry) 줍니다.',
            },
            15: {
              title: '15레벨: 이진 소수의 연산',
              tip: '이진 소수의 덧셈과 변환',
              example: '0.1 + 1.1 -> 10.0 (10진수로 0.5 + 1.5 = 2.0)',
              strategy: '2진수의 소수점 아래 자리는 0.1이 0.5(1/2), 0.01이 0.25(1/4)를 나타냅니다.',
            },
          };
        } else {
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
              title: '23레벨: 소수의 덧셈 2',
              tip: '더 다양한 소수 덧셈',
              example: '0.3 + 0.4 = 0.7',
              strategy: '소수점 자리수를 그대로 유지하며 덧셈하세요.',
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
        }
      } else if (category === '대수') {
        title = '방정식 풀이 팁';
        icon = '🧩';
        description = '핵심 로직: "이항(Transposition) = 부호 반대(Change Sign)."';
        tips = {
          1: {
            title: '1레벨: 미지수 □ 덧셈',
            tip: '더해서 나왔으니 → 뺀다',
            example: '□ + 3 = 8',
            strategy: '결과값(8)에서 더해진 숫자(3)를 빼서 미지수를 구합니다. 정답은 5.',
          },
          2: {
            title: '2레벨: 미지수 □ 뺄셈 1',
            tip: '빼기 전 숫자는 더해서 찾는다',
            example: '□ - 3 = 5',
            strategy: '결과값(5)에 뺀 숫자(3)를 더해서 미지수를 구합니다. 정답은 8.',
          },
          3: {
            title: '3레벨: 미지수 □ 뺄셈 2',
            tip: '원래 수에서 남은 수를 뺀다',
            example: '10 - □ = 7',
            strategy: '시작 숫자(10)에서 결과값(7)을 빼면 빈칸이 나옵니다. 정답은 3.',
          },
          4: {
            title: '4레벨: 미지수 □ 곱셈',
            tip: '곱해서 나왔으니 → 나눈다',
            example: '□ × 4 = 12',
            strategy: '결과값(12)을 곱한 수(4)로 나누어 빈칸을 구합니다. 정답은 3.',
          },
          5: {
            title: '5레벨: 미지수 □ 나눗셈',
            tip: '나누기 전 숫자는 곱해서 찾는다',
            example: '□ ÷ 3 = 4',
            strategy: '결과값(4)에 나눈 수(3)를 곱하여 빈칸을 구합니다. 정답은 12.',
          },
          6: {
            title: '6레벨: 일차방정식 기초',
            tip: '□ 자리에 문자 x가 들어간 것뿐입니다.',
            example: 'x + 3 = 8',
            strategy: '빈칸 채우기와 동일하게 x의 값을 구합니다. x = 5.',
          },
          7: {
            title: '7레벨: 일차방정식 곱셈',
            tip: '숫자와 문자 사이의 곱셈은 생략됩니다.',
            example: '3x = 12',
            strategy: '3 곱하기 x가 12이므로 양변을 3으로 나눕니다. x = 4.',
          },
          8: {
            title: '8레벨: 이항 기초',
            tip: '덧셈/뺄셈을 먼저 넘긴 후 계수로 나눕니다.',
            example: '2x + 3 = 7',
            strategy: '+3을 이항하면 -3이 되어 2x=4가 됩니다. 양변을 2로 나누면 x=2.',
          },
          9: {
            title: '9레벨: 이항 기초 뺄셈',
            tip: '뺄셈이 이항하면 덧셈이 됩니다.',
            example: '2x - 3 = 7',
            strategy: '-3을 이항하면 +3이 되어 2x=10이 됩니다. 양변을 2로 나누면 x=5.',
          },
          10: {
            title: '10레벨: 이항 심화',
            tip: '조금 더 큰 숫자의 일차방정식입니다.',
            example: '3x + 10 = 40',
            strategy: '상수를 정리하면 3x=30이 되고, 양변을 3으로 나누면 x=10이 됩니다.',
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
            title: '1레벨: 1사분면 좌표 조준',
            tip: 'x축(가로) 좌표 and y축(세로) 좌표를 읽으세요.',
            example: '좌표 (3, 4) 조준',
            strategy: '원점(0,0)에서 오른쪽으로 3칸, 위쪽으로 4칸 간 좌표를 찾아 조준하세요.',
          },
          2: {
            title: '2레벨: 사분면 좌표 조준',
            tip: '마이너스 부호(-)는 왼쪽/아래쪽을 뜻합니다.',
            example: '좌표 (-2, 3) 조준',
            strategy: '원점에서 왼쪽으로 2칸, 위쪽으로 3칸 간 좌표를 찾아 조준하세요.',
          },
          3: {
            title: '3레벨: 함숫값 - 덧셈',
            tip: 'x 자리에 주어진 입력값을 넣으세요.',
            example: 'f(x) = x + 3 일 때, f(2) = 5',
            strategy: 'x 대신 2를 넣고 단순 덧셈을 수행하면 됩니다. 2 + 3 = 5.',
          },
          4: {
            title: '4레벨: 함숫값 - 제곱',
            tip: 'x 자리에 입력값을 넣고 제곱하세요.',
            example: 'f(x) = x² 일 때, f(3) = 9',
            strategy: 'x 대신 3을 넣고 제곱(3 × 3)을 수행합니다. 3² = 9.',
          },
          5: {
            title: '5레벨: 함숫값 믹스',
            tip: '덧셈 함수와 제곱 함수가 무작위로 등장합니다.',
            example: '다양한 함숫값 대입',
            strategy: '제시된 함수가 덧셈형인지 제곱형인지 빠르게 눈으로 파악한 뒤 대입하세요.',
          },
          6: {
            title: '6레벨: 무한대 발산',
            tip: 'x가 무한히 커질 때의 극한값을 구합니다.',
            example: 'x + 1 (x → ∞) 의 값은 무한대(∞)',
            strategy:
              'x에 계속해서 큰 수를 넣는 것을 상상하면 답은 당연히 무한히 커진 기호(∞)가 됩니다.',
          },
          7: {
            title: '7레벨: 영(0)으로 수렴',
            tip: '분모가 무한히 커지면 값은 0에 가까워집니다.',
            example: '1 / x (x → ∞) 의 값은 0',
            strategy: '피자 1판을 무한히 많은 사람이 나눠 먹는다고 생각하세요. 몫은 0이 됩니다.',
          },
          8: {
            title: '8레벨: 기울기의 극한',
            tip: '분모와 분자의 차수가 같을 때 극한값 구하기.',
            example: '2x / x (x → ∞) 의 값은 2',
            strategy: 'x를 약분하면 상수 2만 남으므로, 극한값은 2가 됩니다.',
          },
          9: {
            title: '9레벨: 다항함수 미분',
            tip: '지수 n을 앞으로 내리고 차수를 1 줄입니다.',
            example: 'd/dx(x³) , x=2 일 때 값은 3 × 2² = 12',
            strategy: 'x³을 미분하면 3x²이 됩니다. x=2를 대입하면 3 × 4 = 12가 됩니다.',
          },
          10: {
            title: '10레벨: 미분과 계수',
            tip: '계수가 붙어 있으면 지수 n을 앞으로 내리며 계수와 곱합니다.',
            example: 'd/dx(2x³) , x=1 일 때 값은 2 × 3 = 6',
            strategy: '2x³을 미분하면 6x²이 됩니다. x=1을 대입하면 6 × 1 = 6이 됩니다.',
          },
          11: {
            title: '11레벨: 일차식 미분',
            tip: '일차식 ax를 미분하면 계수 a만 남습니다.',
            example: 'd/dx(3x) 의 값은 3',
            strategy: '일차식의 미분은 접선의 기울기가 항상 일정하므로 계수가 답입니다.',
          },
          12: {
            title: '12레벨: 상수 미분',
            tip: '변하지 않는 상수 c를 미분하면 무조건 0입니다.',
            example: 'd/dx(5) 의 값은 0',
            strategy: '상수함수는 그래프가 가로 평행선이므로 모든 구간에서 접선 기울기는 0입니다.',
          },
          13: {
            title: '13레벨: 차수 올리기 (적분)',
            tip: '미분의 반대 과정! 지수에 1을 더하고 차수를 올립니다.',
            example: '∫ 3x² dx, x=2 일 때 값은 2³ = 8 (C=0)',
            strategy: '3x²의 부정적분은 x³입니다. x=2를 대입하면 2³ = 8이 됩니다.',
          },
          14: {
            title: '14레벨: 단순 적분',
            tip: '상수 a를 적분하면 ax가 됩니다.',
            example: '∫ 5 dx, x=1 일 때 값은 5 × 1 = 5 (C=0)',
            strategy: '상수 5를 적분하면 5x가 되며, x=1 대입 시 정답은 5입니다.',
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
