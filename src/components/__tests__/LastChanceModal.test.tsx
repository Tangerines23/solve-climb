import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { LastChanceModal } from '../LastChanceModal';

describe('LastChanceModal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when isVisible is false', () => {
    const { container } = render(
      <LastChanceModal
        isVisible={false}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should render for time-attack mode', () => {
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    expect(screen.getByText('LAST CHANCE!')).toBeInTheDocument();
    // Check for time-attack specific content
    const content = screen.getByText(/라스트 스퍼트로 15초 더 뛸 수 있습니다/);
    expect(content).toBeInTheDocument();
  });

  it('should render for survival mode', () => {
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="survival"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    // Check for survival specific content
    const content = screen.getByText(/구조 신호탄을 사용하여 부활하시겠습니까/);
    expect(content).toBeInTheDocument();
  });

  it('should show use item button when inventory has items', () => {
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={2}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    expect(screen.getByText(/아이템 사용/)).toBeInTheDocument();
  });

  it('should call onUseItem when use button is clicked', () => {
    const onUseItem = vi.fn();
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={1}
        userMinerals={100}
        onUseItem={onUseItem}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    const useButton = screen.getByText(/아이템 사용/);
    fireEvent.click(useButton);

    expect(onUseItem).toHaveBeenCalled();
  });

  it('should call onPurchaseAndUse when buy button is clicked', () => {
    const onPurchaseAndUse = vi.fn();
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={200}
        onUseItem={vi.fn()}
        onPurchaseAndUse={onPurchaseAndUse}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    const buyButton = screen.getByText(/즉시 구매 & 사용/);
    fireEvent.click(buyButton);

    expect(onPurchaseAndUse).toHaveBeenCalled();
  });

  it('should call onGiveUp when give up button is clicked', () => {
    const onGiveUp = vi.fn();
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={onGiveUp}
        basePrice={50}
      />
    );

    const giveUpButton = screen.getByText(/그냥 기록 남기기/);
    fireEvent.click(giveUpButton);

    expect(onGiveUp).toHaveBeenCalled();
  });

  it('should show disabled buy button when user cannot afford', () => {
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={50}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    const buyButton = screen.getByText(/즉시 구매 & 사용/);
    expect(buyButton).toBeDisabled();
    expect(screen.getByText(/미네랄 부족/)).toBeInTheDocument();
  });

  it('should show countdown timer', () => {
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should display countdown timer initially', () => {
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    // Timer should be displayed (initial value is 10)
    const timer = screen.getByText('10');
    expect(timer).toBeInTheDocument();
  });

  it('should call onWatchAd when watch ad button is clicked', () => {
    const onWatchAd = vi.fn();
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={onWatchAd}
        onGiveUp={vi.fn()}
        basePrice={50}
      />
    );

    const adButton = screen.getByText(/광고 보고 무료 부활/);
    fireEvent.click(adButton);

    expect(onWatchAd).toHaveBeenCalled();
  });

  it('should call onGiveUp when countdown timer reaches 0', () => {
    const onGiveUp = vi.fn();
    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={vi.fn()}
        onGiveUp={onGiveUp}
        basePrice={50}
      />
    );

    // Fast-forward past 10 seconds and flush microtasks/setTimeout
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(onGiveUp).toHaveBeenCalledTimes(1);
  });

  it('should pause countdown timer while ad is loading and not call onGiveUp', async () => {
    const onGiveUp = vi.fn();
    // Simulate long-running ad (e.g. 30 seconds)
    let resolveAd: () => void = () => {};
    const onWatchAd = vi.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveAd = resolve;
      });
    });

    render(
      <LastChanceModal
        isVisible={true}
        gameMode="time-attack"
        inventoryCount={0}
        userMinerals={100}
        onUseItem={vi.fn()}
        onPurchaseAndUse={vi.fn()}
        onWatchAd={onWatchAd}
        onGiveUp={onGiveUp}
        basePrice={50}
      />
    );

    // 2초 경과 후 광고 버튼 클릭
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    const adButton = screen.getByText(/광고 보고 무료 부활/);
    await act(async () => {
      fireEvent.click(adButton);
    });

    expect(onWatchAd).toHaveBeenCalledTimes(1);

    // 광고 보는 동안 30초가 지나도 타이머가 일시정지되어 onGiveUp이 호출되지 않아야 함!
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(onGiveUp).not.toHaveBeenCalled();

    // 광고 완료
    await act(async () => {
      resolveAd();
    });
  });
});
