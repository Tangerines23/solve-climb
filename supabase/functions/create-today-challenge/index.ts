// Supabase Edge Function: 오늘의 챌린지 자동 생성
// 이 함수는 매일 자정에 실행되어 오늘의 챌린지를 생성합니다.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const today = new Date().toISOString().split('T')[0]
    
    // 오늘 챌린지가 이미 있는지 확인
    const { data: existing } = await supabaseAdmin
      .from('today_challenges')
      .select('*')
      .eq('challenge_date', today)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ message: 'Challenge already exists', challenge: existing }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // 날짜를 시드로 변환 (YYYYMMDD)
    const dateParts = today.split('-')
    const seed = parseInt(dateParts[0] + dateParts[1] + dateParts[2], 10)

    // 시드 기반 랜덤 생성기
    class SeededRandom {
      private seed: number
      constructor(seed: number) {
        this.seed = seed
      }
      random(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233280
      }
      randomInt(min: number, max: number): number {
        return Math.floor(this.random() * (max - min)) + min
      }
    }

    const rng = new SeededRandom(seed)

    // 카테고리 목록 (수학의 산, 언어의 산만 사용 - 논리, 상식 제외)
    const categories = [
      { id: 'language', name: '언어' },
      { id: 'math', name: '수학' },
    ].sort((a, b) => a.id.localeCompare(b.id))

    // 서브토픽 매핑 (수열 제외)
    const subTopicsMap: Record<string, Array<{ id: string; name: string }>> = {
      math: [
        { id: 'arithmetic', name: '사칙연산' },
        { id: 'calculus', name: '미적분' },
        { id: 'equations', name: '방정식' },
        // sequence 제거됨
      ],
      language: [
        { id: 'chinese', name: '중국어' },
        { id: 'english', name: '영어' },
        { id: 'japanese', name: '일본어' },
        { id: 'korean', name: '한글' },
      ],
    }

    // 레벨 범위 (각 서브토픽별)
    const levelRanges: Record<string, Record<string, number>> = {
      math: {
        arithmetic: 15,
        calculus: 10,
        equations: 15,
        // sequence 제거됨
      },
      language: {
        chinese: 10,
        english: 10,
        japanese: 10,
        korean: 10,
      },
    }

    // 1. 카테고리 선택
    const categoryIndex = rng.randomInt(0, categories.length)
    const selectedCategory = categories[categoryIndex]

    // 2. 서브토픽 선택
    const subTopics = subTopicsMap[selectedCategory.id] || []
    if (subTopics.length === 0) {
      throw new Error(`No sub topics for category: ${selectedCategory.id}`)
    }
    const sortedSubTopics = [...subTopics].sort((a, b) => a.id.localeCompare(b.id))
    const topicIndex = rng.randomInt(0, sortedSubTopics.length)
    const selectedTopic = sortedSubTopics[topicIndex]

    // 3. 레벨 선택
    const maxLevel = levelRanges[selectedCategory.id]?.[selectedTopic.id] || 10
    const level = rng.randomInt(1, maxLevel + 1)

    // 챌린지 제목 생성
    const title = `${selectedTopic.name} Level ${level}!`

    // 새 챌린지 생성
    const { data: newChallenge, error } = await supabaseAdmin
      .from('today_challenges')
      .insert({
        challenge_date: today,
        category_id: selectedCategory.id,
        category_name: selectedCategory.name,
        topic_id: selectedTopic.id,
        topic_name: selectedTopic.name,
        level: level,
        mode: 'time_attack',
        title: title,
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ message: 'Challenge created', challenge: newChallenge }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

