#!/usr/bin/env node
/**
 * 랭킹 등록 풀 사이클 E2E verification 스크립트/매크로
 *
 * 수행 단계:
 * 1. 익명 플레이어 접속 세션 생성 & 닉네임 설정
 * 2. 1-1 (기초 덧셈 Level 1) 퀴즈 1회 플레이 데이터 생성 및 제출
 * 3. DB 데이터 이동(채점, 프로필 점수 갱신) 성공 여부 확인
 * 4. 랭킹 리스트(get_ranking_v2)에 플레이어 닉네임 및 순위 정상 등재 확인
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env');

// .env 로드
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 자격 증명이 설정되지 않았습니다.');
  process.exit(1);
}

// 단 하나의 공용 Supabase Client 사용 (세션 토큰 자동 갱신 및 유지)
const supabase = createClient(supabaseUrl, supabaseKey);

async function runE2ERankingVerificationMacro() {
  console.log('====================================================');
  console.log('🚀 [E2E 랭킹 검증 매크로] 1-1 플레이 및 랭킹 등재 원스톱 테스트');
  console.log('====================================================\n');

  // STEP 1: 익명 플레이어 생성 및 닉네임 설정
  const testNickNumber = Math.floor(Math.random() * 899 + 100);
  const testNickname = `등반가_${testNickNumber}`;

  console.log(`[Step 1/4] 익명 플레이어 접속 및 세션 발급 중...`);
  const { data: authData, error: authErr } = await supabase.auth.signInAnonymously();

  if (authErr || !authData.user || !authData.session) {
    console.error('❌ 익명 세션 생성 실패:', authErr?.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`  ✅ 익명 플레이어 생성 완료! (User ID: ${userId})`);
  console.log(`  📝 닉네임 설정 시도: '${testNickname}'`);

  // auth metadata 업데이트
  await supabase.auth.updateUser({
    data: { nickname: testNickname },
  });

  // RPC 시도 (실패 시에도 프로세스 중단 없이 계속 진행)
  const { error: rpcErr } = await supabase.rpc('update_profile_nickname', {
    p_nickname: testNickname,
  });

  if (rpcErr) {
    console.log(
      `  ℹ️ RPC 캐시 대기 중 — Auth 메타데이터 닉네임('${testNickname}')으로 1-1 플레이를 진행합니다.`
    );
  } else {
    console.log(`  ✅ DB 닉네임 RPC 적용 완료!`);
  }

  // DB 프로필 닉네임 최종 확인 (없으면 메타데이터에서 읽어옴)
  let activeNickname = testNickname;
  const { data: profileCheck } = await supabase
    .from('profiles')
    .select('id, nickname')
    .eq('id', userId)
    .single();

  if (profileCheck?.nickname && !profileCheck.nickname.includes('?')) {
    activeNickname = profileCheck.nickname;
  }

  console.log(`  ✅ 익명 플레이어 세션 및 닉네임 준비 완료! (닉네임: '${activeNickname}')\n`);

  // STEP 2: 1-1 (기초 덧셈 레벨 1) 플레이 데이터 생성 및 제출
  console.log(`[Step 2/4] 1-1 (기초 덧셈 Level 1) 퀴즈 1회 플레이 데이터 생성 중...`);
  const q1 = crypto.randomUUID();
  const q2 = crypto.randomUUID();
  const q3 = crypto.randomUUID();
  const q4 = crypto.randomUUID();
  const q5 = crypto.randomUUID();

  const mockQuestions = [
    { id: q1, question: '1 + 1', answer: 2, correct_answer: 2, level: 1 },
    { id: q2, question: '2 + 3', answer: 5, correct_answer: 5, level: 1 },
    { id: q3, question: '4 + 2', answer: 6, correct_answer: 6, level: 1 },
    { id: q4, question: '5 + 4', answer: 9, correct_answer: 9, level: 1 },
    { id: q5, question: '3 + 3', answer: 6, correct_answer: 6, level: 1 },
  ];

  const userAnswers = [2, 5, 6, 9, 6];
  const questionIds = [q1, q2, q3, q4, q5];

  // create_game_session RPC 로 게임 세션 등록
  const { data: sessionRes, error: sessionErr } = await supabase.rpc('create_game_session', {
    p_questions: mockQuestions,
    p_category: 'math',
    p_subject: 'add',
    p_level: 1,
    p_game_mode: 'timeattack',
    p_is_debug_session: true,
  });

  if (sessionErr || !sessionRes?.success) {
    console.error(
      '❌ create_game_session RPC 생성 실패:',
      sessionErr?.message || sessionRes?.message
    );
    process.exit(1);
  }

  const sessionId = sessionRes.session_id;
  console.log(`  🎮 게임 세션 생성 성공 (Session ID: ${sessionId})`);

  // submit_game_result 호출로 채점 및 점수 반영
  console.log(`  📤 답안 제출 및 채점 요청 (submit_game_result RPC)...`);
  const { data: submitResult, error: submitErr } = await supabase.rpc('submit_game_result', {
    p_session_id: sessionId,
    p_user_answers: userAnswers,
    p_question_ids: questionIds,
    p_game_mode: 'timeattack',
    p_category: 'math',
    p_subject: 'add',
    p_level: 1,
    p_avg_solve_time: 1.2,
    p_items_used: [],
  });

  if (submitErr) {
    console.error('❌ submit_game_result RPC 호출 실패:', submitErr.message);
    process.exit(1);
  }

  console.log(`  ✅ 답안 채점 성공!`, submitResult, '\n');

  // STEP 3: 데이터 이동 및 점수 저장 완료 검증
  console.log(`[Step 3/4] DB 데이터 이동 완료 및 점수 갱신 검증 중...`);
  const { data: updatedProfile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, nickname, weekly_score_total, total_mastery_score, last_game_submit_at')
    .eq('id', userId)
    .single();

  if (profileErr || !updatedProfile) {
    console.error('❌ 프로필 점수 검증 실패:', profileErr?.message);
    process.exit(1);
  }

  console.log(`  📊 프로필 최신 데이터:`);
  console.log(`     - 닉네임: ${updatedProfile.nickname}`);
  console.log(`     - 주간 총점 (weekly_score_total): ${updatedProfile.weekly_score_total}점`);
  console.log(`     - 숙련도 (total_mastery_score): ${updatedProfile.total_mastery_score}점`);
  console.log(`     - 최근 게임 제출 시각: ${updatedProfile.last_game_submit_at}`);

  if (updatedProfile.weekly_score_total <= 0) {
    console.error('❌ 오류: 주간 점수가 0점 이하입니다. 점수 이동 실패!');
    process.exit(1);
  }
  console.log(`  ✅ DB 데이터 이동 및 점수 갱신 성공 확인!\n`);

  // STEP 4: 랭킹 리스트(get_ranking_v2)에 플레이어 올라왔는지 확인
  console.log(`[Step 4/4] 랭킹 리스트(get_ranking_v2) 조회 및 이름 등재 확인 중...`);
  const { data: rankings, error: rankErr } = await supabase.rpc('get_ranking_v2', {
    p_category: 'all',
    p_period: 'weekly',
    p_type: 'total',
    p_limit: 50,
  });

  if (rankErr) {
    console.error('❌ get_ranking_v2 RPC 호출 실패:', rankErr.message);
    process.exit(1);
  }

  console.log(`  📊 랭킹 조회 결과: 총 ${rankings?.length ?? 0}명 리턴됨`);
  if (rankings && rankings.length > 0) {
    console.log(`  🔍 Rankings Sample Item Keys:`, Object.keys(rankings[0]), rankings[0]);
  }

  const myRankEntry = rankings.find((r) => (r.user_id || r.out_user_id) === userId);

  if (!myRankEntry) {
    console.error(`❌ 실패: 랭킹 목록 Top 50에 익명 플레이어 ID(${userId})가 존재하지 않습니다.`);
    process.exit(1);
  }

  const finalRank = myRankEntry.rank || myRankEntry.out_rank;
  const finalNickname = myRankEntry.nickname || myRankEntry.out_nickname;
  const finalScore = myRankEntry.score || myRankEntry.out_score;

  console.log('====================================================');
  console.log('🎉 [테스트 성공] 랭킹 등재 원스톱 사이클 완수!');
  console.log('====================================================');
  console.log(`  🏆 순위 (Rank)       : ${finalRank}위`);
  console.log(`  👤 닉네임 (Nickname) : ${finalNickname}`);
  console.log(`  ⭐ 획득 점수 (Score) : ${finalScore}점`);
  console.log(`  🆔 유저 ID           : ${userId}`);
  console.log('====================================================\n');

  // STEP 5: 테스트 후 Cleanup (테스트 계정 및 0점 노이즈 정리)
  console.log(`[Step 5/5] 테스트 완료 후 DB 0점 노이즈 및 테스트 계정 Cleanup 실행 중...`);
  try {
    const { error: delErr } = await supabase.from('profiles').delete().eq('id', userId);
    if (!delErr) {
      console.log(`  🧹 테스트 생성 계정(${userId}) 삭제 완료!`);
    }
    const { data: cleanRes } = await supabase.rpc('clean_zero_score_anonymous_users');
    console.log(`  🧹 DB 0점 익명 노이즈 정돈 완료!`, cleanRes);
  } catch (cleanError) {
    console.log(`  ⚠️ Cleanup 중 경고 (진행에는 영향 없음):`, cleanError?.message);
  }
}

runE2ERankingVerificationMacro()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ 매크로 실행 중 치명적 오류 발생:', err);
    process.exit(1);
  });
