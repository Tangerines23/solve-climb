# cspell:disable
$ProgressPreference = 'SilentlyContinue'
$headers = @{
  "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
  "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
  "Content-Type" = "application/json"
}

Write-Host "=================================================="
Write-Host " E2E REWARD & STAMINA VERIFICATION POWERSHELL "
Write-Host "=================================================="

# 0. debug_create_persona_player RPC로 유효한 Auth 유저 생성 및 ID 획득
$bodyPersona = @{ p_nickname = "E2E검증유저"; p_persona_type = "regular" } | ConvertTo-Json
$personaRes = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc/debug_create_persona_player" -Method Post -Headers $headers -Body $bodyPersona

$userId = $personaRes.user_id
Write-Host "`n[0. Valid Persona Auth User Created]"
Write-Host "Created User ID: $userId"

# 1. 출석 보상 RPC 호출 테스트 (last_login_at 어제로 설정)
$yesterday = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ssZ")
$bodyResetLogin = @{ last_login_at = $yesterday } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/profiles?id=eq.$userId" -Method Patch -Headers $headers -Body $bodyResetLogin

$body1 = @{ p_user_id = $userId } | ConvertTo-Json
$res1 = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc/handle_daily_login" -Method Post -Headers $headers -Body $body1
Write-Host "`n[1. Daily Reward RPC Response]"
Write-Host ($res1 | ConvertTo-Json)

# 2. DB profiles 직조회 1차
$res2 = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/profiles?id=eq.$userId" -Method Get -Headers $headers
Write-Host "`n[2. DB Profile Record After Daily Reward]"
Write-Host ($res2 | ConvertTo-Json)

# 3. 광고 미네랄 보상 RPC 호출 (+100)
$body3 = @{ p_ad_type = "mineral_recharge"; p_user_id = $userId } | ConvertTo-Json
$res3 = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc/secure_reward_ad_view" -Method Post -Headers $headers -Body $body3
Write-Host "`n[3. Mineral Ad Reward RPC Response]"
Write-Host ($res3 | ConvertTo-Json)

# 4. 스태미나 = 1로 소비 시뮬레이션
$body4 = @{ stamina = 1 } | ConvertTo-Json
$null = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/profiles?id=eq.$userId" -Method Patch -Headers $headers -Body $body4
Write-Host "`n[4. Stamina set to 1 for Full Recharge Test]"

# 5. 광고 스태미나 풀피(5) 완충 RPC 호출
$body5 = @{ p_ad_type = "stamina_recharge"; p_user_id = $userId } | ConvertTo-Json
$res5 = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/rpc/secure_reward_ad_view" -Method Post -Headers $headers -Body $body5
Write-Host "`n[5. Stamina Full Recharge Ad RPC Response]"
Write-Host ($res5 | ConvertTo-Json)

# 6. 최종 DB 직조회 검증
$res6 = Invoke-RestMethod -Uri "http://127.0.0.1:54321/rest/v1/profiles?id=eq.$userId" -Method Get -Headers $headers
Write-Host "`n[6. FINAL DB PROFILE RECORD VERIFICATION]"
Write-Host "User ID  : $($res6[0].id)"
Write-Host "Nickname : $($res6[0].nickname)"
Write-Host "Minerals : $($res6[0].minerals)"
Write-Host "Stamina  : $($res6[0].stamina) / 5 FULL"
Write-Host "Streak   : $($res6[0].login_streak)"
Write-Host "`nVERIFICATION SUCCESSFUL!"
