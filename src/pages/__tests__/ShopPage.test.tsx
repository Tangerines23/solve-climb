import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ShopPage } from '../ShopPage';
import { BrowserRouter } from 'react-router-dom';
import { useShop } from '@/hooks/useShop';
import { UI_MESSAGES } from '@/constants/ui';

// Mock dependencies
vi.mock('@/hooks/useShop');
vi.mock('@/components/Header', () => ({ Header: () => <div data-testid="header" /> }));
vi.mock('@/components/FooterNav', () => ({ FooterNav: () => <div data-testid="footer-nav" /> }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ShopPage', () => {
  const defaultShopValues = {
    items: [
      { id: '1', code: 'ITEM_01', name: '아이템 1', description: '설명 1', price: 100 },
      { id: '2', code: 'ITEM_02', name: '아이템 2', description: '설명 2', price: 200 },
    ],
    isLoading: false,
    purchaseStatus: null,
    isAdLoading: false,
    minerals: 1000,
    inventory: [],
    handlePurchase: vi.fn(),
    handleMineralsAdRecharge: vi.fn(),
    getOwnedCount: vi.fn().mockReturnValue(0),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useShop).mockReturnValue(defaultShopValues as any);
  });

  it('should render shop title and user minerals', () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    expect(screen.getByText(UI_MESSAGES.SHOP_TITLE)).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should navigate back when back button is clicked', () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    const backButton = screen.getByLabelText('뒤로 가기');
    fireEvent.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('should switch between shop and bag tabs', () => {
    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    // Initial state is shop
    expect(screen.getByText(UI_MESSAGES.FREE_MINERAL_RECHARGE)).toBeInTheDocument();

    // Switch to Bag tab
    const bagTab = screen.getByText(UI_MESSAGES.SHOP_TAB_BAG);
    fireEvent.click(bagTab);

    expect(screen.getByText(UI_MESSAGES.MY_BAG)).toBeInTheDocument();
    expect(screen.queryByText(UI_MESSAGES.FREE_MINERAL_RECHARGE)).not.toBeInTheDocument();
  });

  it('should display empty bag message when inventory is empty', () => {
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      inventory: [],
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(UI_MESSAGES.SHOP_TAB_BAG));
    expect(screen.getByText(UI_MESSAGES.EMPTY_BAG)).toBeInTheDocument();
  });

  it('should display inventory items in bag tab', () => {
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      inventory: [{ id: 'inv-1', code: 'ITEM_01', name: '보유 아이템 1', quantity: 5 }],
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText(UI_MESSAGES.SHOP_TAB_BAG));
    expect(screen.getByText('보유 아이템 1')).toBeInTheDocument();
    expect(screen.getByText('x5')).toBeInTheDocument();
  });

  it('should show loading indicator when shop is loading and no items', () => {
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      items: [],
      isLoading: true,
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    expect(screen.getByText(UI_MESSAGES.LOADING_SHOP)).toBeInTheDocument();
  });

  it('should trigger ad recharge handler when ad button is clicked', () => {
    const handleMineralsAdRecharge = vi.fn();
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      handleMineralsAdRecharge,
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    const adButton = screen.getByText(UI_MESSAGES.WATCH_AD);
    fireEvent.click(adButton);
    expect(handleMineralsAdRecharge).toHaveBeenCalled();
  });

  it('should show "AD_WATCHING" text when ad is loading', () => {
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      isAdLoading: true,
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    expect(screen.getByText(UI_MESSAGES.AD_WATCHING)).toBeInTheDocument();
    expect(screen.getByText(UI_MESSAGES.AD_WATCHING)).toBeDisabled();
  });

  it('should show "OWNED_COUNT" badge if user owns the item', () => {
    const getOwnedCount = vi.fn().mockImplementation((code) => {
      if (code === 'ITEM_01') return 3;
      return 0;
    });

    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      getOwnedCount,
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    expect(screen.getByText(UI_MESSAGES.OWNED_COUNT(3))).toBeInTheDocument();
  });

  it('should trigger purchase handler when purchase button is clicked', () => {
    const handlePurchase = vi.fn();
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      handlePurchase,
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    const purchaseButtons = screen.getAllByText(UI_MESSAGES.PURCHASE);
    fireEvent.click(purchaseButtons[0]);
    expect(handlePurchase).toHaveBeenCalledWith('1', 100);
  });

  it('should show purchase status message for a specific item', () => {
    vi.mocked(useShop).mockReturnValue({
      ...defaultShopValues,
      purchaseStatus: { id: '2', message: '구매 완료!' },
    } as any);

    render(
      <BrowserRouter>
        <ShopPage />
      </BrowserRouter>
    );

    expect(screen.getByText('구매 완료!')).toBeInTheDocument();
    // Item 1 should still show PURCHASE
    expect(screen.getAllByText(UI_MESSAGES.PURCHASE)).toHaveLength(1);
  });
});
