/**
 * TOSS_API_BASIC_AUTH 값 검증 스크립트
 *
 * 사용법:
 * node scripts/check-basic-auth.js "your_base64_value"
 *
 * 또는 브라우저 콘솔에서:
 * checkBasicAuth("your_base64_value")
 */

function checkBasicAuth(base64Value) {
  console.log('🔍 TOSS_API_BASIC_AUTH 값 검증 시작...\n');

  if (!base64Value || typeof base64Value !== 'string') {
    console.error('❌ 값이 비어있거나 문자열이 아닙니다.');
    return false;
  }

  // "Basic " 접두사 제거
  let value = base64Value.trim();
  if (value.startsWith('Basic ')) {
    value = value.substring(6);
    console.log('⚠️ "Basic " 접두사 제거됨');
  }

  // Base64 형식 검증
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(value)) {
    console.error('❌ Base64 형식이 아닙니다.');
    console.log('   Base64는 A-Z, a-z, 0-9, +, / 문자만 사용하고, 끝에 = 패딩이 있을 수 있습니다.');
    return false;
  }

  console.log('✅ Base64 형식 검증 통과');
  console.log(`   길이: ${value.length}자`);

  // 디코딩 시도
  try {
    const decoded = atob(value);
    console.log(`\n📝 디코딩된 값: ${decoded.substring(0, 50)}...`);

    // client_id:client_secret 형식인지 확인
    if (decoded.includes(':')) {
      const parts = decoded.split(':');
      if (parts.length === 2) {
        console.log('✅ 올바른 형식입니다! (client_id:client_secret)');
        console.log(`   client_id: ${parts[0]}`);
        console.log(`   client_secret: ${parts[1].substring(0, 10)}...`);
        return true;
      } else {
        console.warn('⚠️ ":" 구분자가 여러 개 있거나 형식이 올바르지 않습니다.');
        return false;
      }
    } else {
      console.error('❌ ":" 구분자가 없습니다. client_id:client_secret 형식이어야 합니다.');
      return false;
    }
  } catch (error) {
    console.error('❌ Base64 디코딩 실패:', error.message);
    return false;
  }
}

// Node.js 환경에서 실행
if (typeof require !== 'undefined' && require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('사용법: node scripts/check-basic-auth.js "base64_value"');
    console.log('\n예시:');
    console.log('node scripts/check-basic-auth.js "Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="');
    process.exit(1);
  }

  const result = checkBasicAuth(args[0]);
  process.exit(result ? 0 : 1);
}

// 브라우저 환경에서 사용 가능하도록 export
if (typeof window !== 'undefined') {
  window.checkBasicAuth = checkBasicAuth;
}
