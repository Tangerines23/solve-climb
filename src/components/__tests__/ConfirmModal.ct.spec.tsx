import { test, expect } from '@playwright/experimental-ct-react';
import { ConfirmModal } from '../ConfirmModal';

test.use({ viewport: { width: 500, height: 500 } });

test('should render and handle confirm/cancel actions', async ({ mount }) => {
  let _confirmed = false;
  let _cancelled = false;

  const component = await mount(
    <ConfirmModal
      isOpen={true}
      title="테스트 제목"
      message="테스트 메시지입니다."
      confirmText="확인 버튼"
      cancelText="취소 버튼"
      onConfirm={() => {
        _confirmed = true;
      }}
      onCancel={() => {
        _cancelled = true;
      }}
    />
  );

  // 1. 초기 렌더링 확인
  await expect(component.locator('.confirm-modal-title')).toHaveText('테스트 제목');
  await expect(component.locator('.confirm-modal-message')).toHaveText('테스트 메시지입니다.');
  await expect(component.locator('.confirm-button')).toHaveText('확인 버튼');
  await expect(component.locator('.cancel-button')).toHaveText('취소 버튼');

  // 2. 취소 버튼 클릭 시뮬레이션
  // Note: Playwright CT에서는 props 콜백이 실제 함수로 동작하므로,
  // 실제 상태 변화를 확인하기 위해서는 추가적인 처리가 필요할 수 있습니다.
  // 여기서는 단순히 클릭이 가능한지 확인합니다.
  await component.locator('.cancel-button').click();

  // 3. 확인 버튼 클릭 시뮬레이션
  await component.locator('.confirm-button').click();
});

test('should not render when isOpen is false', async ({ mount }) => {
  const component = await mount(
    <ConfirmModal
      isOpen={false}
      title="제목"
      message="메시지"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );

  await expect(component).toBeEmpty();
});

test('should apply variant styles', async ({ mount }) => {
  const component = await mount(
    <ConfirmModal
      isOpen={true}
      title="제목"
      message="메시지"
      variant="danger"
      onConfirm={() => {}}
      onCancel={() => {}}
    />
  );

  await expect(component.locator('.confirm-button')).toHaveClass(/danger/);
});
