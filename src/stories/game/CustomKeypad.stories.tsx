import type { Meta, StoryObj } from '@storybook/react-vite';
import { CustomKeypad } from '@/components/CustomKeypad';

// Keypad needs special styling container to look good (usually it's at the bottom)
const KeypadContainer = (Story: any) => (
  <div
    style={{
      width: '100%',
      maxWidth: '400px',
      margin: '0 auto',
      backgroundColor: '#0f172a',
      padding: '20px',
      borderRadius: '16px',
    }}
  >
    <Story />
  </div>
);

const meta = {
  title: 'Game Components/CustomKeypad',
  component: CustomKeypad,
  tags: ['autodocs'],
  decorators: [KeypadContainer],
  argTypes: {
    disabled: { control: 'boolean' },
    showNegative: { control: 'boolean' },
    showDecimal: { control: 'boolean' },
    showFraction: { control: 'boolean' },
  },
  args: {
    onNumberClick: () => {},
    onBackspace: () => {},
    onClear: () => {},
    onSubmit: () => {},
    disabled: false,
    showNegative: false,
    showDecimal: false,
    showFraction: false,
  },
} satisfies Meta<typeof CustomKeypad>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithNegativeButton: Story = {
  args: {
    showNegative: true,
  },
};

export const WithDecimalButton: Story = {
  args: {
    showDecimal: true,
  },
};

export const WithFractionButton: Story = {
  args: {
    showFraction: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};
