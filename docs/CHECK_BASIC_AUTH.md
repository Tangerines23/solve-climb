# TOSS_API_BASIC_AUTH 값 확인 가이드

## 🔍 값 검증 방법

### 방법 1: 스크립트 사용 (권장)

터미널에서:
```bash
# Supabase Secrets에서 확인한 값 사용
npm run check:basic-auth "3e7b4a3a882ecd87881b7a53e39056ae0927e7c12c5c2c078146796154472214"

# 또는 직접 실행
node scripts/check-basic-auth.js "your_base64_value"
```

### 방법 2: 브라우저 콘솔에서 확인

브라우저 개발자 도구 콘솔에서:
```javascript
// 함수 정의
function checkBasicAuth(base64Value) {
  let value = base64Value.trim();
  if (value.startsWith('Basic ')) {
    value = value.substring(6);
  }
  
  console.log('길이:', value.length);
  console.log('Base64 형식:', /^[A-Za-z0-9+/]*={0,2}$/.test(value));
  
  try {
    const decoded = atob(value);
    console.log('디코딩된 값:', decoded);
    
    if (decoded.includes(':')) {
      const [clientId, clientSecret] = decoded.split(':');
      console.log('✅ 올바른 형식!');
      console.log('client_id:', clientId);
      console.log('client_secret:', clientSecret.substring(0, 10) + '...');
      return true;
    } else {
      console.error('❌ ":" 구분자가 없습니다');
      return false;
    }
  } catch (error) {
    console.error('❌ 디코딩 실패:', error);
    return false;
  }
}

// 사용
checkBasicAuth("3e7b4a3a882ecd87881b7a53e39056ae0927e7c12c5c2c078146796154472214");
```

### 방법 3: 올바른 값 생성

토스 개발자센터에서 `client_id`와 `client_secret`을 확인한 후:

브라우저 콘솔에서:
```javascript
// 토스 개발자센터에서 확인한 값
const clientId = 'your_client_id';
const clientSecret = 'your_client_secret';

// Base64 인코딩
const basicAuth = btoa(`${clientId}:${clientSecret}`);
console.log('Base64 인코딩된 값:', basicAuth);

// 이 값을 Supabase Secrets에 설정
console.log('\n설정 명령어:');
console.log(`supabase secrets set TOSS_API_BASIC_AUTH="${basicAuth}"`);
```

## ✅ 올바른 형식

- **형식**: Base64 인코딩된 `client_id:client_secret`
- **예시**: `Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ=`
- **특징**:
  - A-Z, a-z, 0-9, +, / 문자만 사용
  - 끝에 = 패딩이 있을 수 있음
  - 디코딩하면 `client_id:client_secret` 형식

## ❌ 잘못된 형식

- "Basic " 접두사 포함 (코드에서 자동 제거하지만 확인 필요)
- Base64가 아닌 일반 문자열
- `:` 구분자가 없는 값
- 너무 짧은 값 (< 10자)

## 🔧 값 재설정 방법

값이 올바르지 않다면:

1. **토스 개발자센터에서 확인**
   - [토스 앱인토스 개발자센터](https://developers-apps-in-toss.toss.im/)
   - 내 앱 > 설정 > OAuth 설정
   - `client_id`와 `client_secret` 확인

2. **Base64 인코딩**
   ```javascript
   // 브라우저 콘솔에서
   const basicAuth = btoa('client_id:client_secret');
   console.log(basicAuth);
   ```

3. **Supabase Secrets에 설정**
   ```bash
   supabase secrets set TOSS_API_BASIC_AUTH="Y2xpZW50X2lkOmNsaWVudF9zZWNyZXQ="
   ```

4. **Edge Functions 재배포**
   ```bash
   supabase functions deploy toss-oauth
   ```

## 📋 체크리스트

- [ ] Base64 형식 검증 통과
- [ ] 디코딩 시 `client_id:client_secret` 형식 확인
- [ ] 토스 개발자센터의 실제 값과 일치
- [ ] "Basic " 접두사 없음
- [ ] 길이가 충분함 (보통 20자 이상)
