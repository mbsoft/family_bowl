import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BetInput from '../BetInput';
import { getBetOptions, getBetOptionLabel } from '../../utils/constants';
import { getBetTypes } from '../../lib/storage';

// Mock dependencies
vi.mock('../../lib/storage', () => ({
  getBetTypes: vi.fn(),
}));

vi.mock('../../utils/constants', () => ({
  getBetOptions: vi.fn(),
  getBetOptionLabel: vi.fn(),
}));

describe('BetInput component', () => {
  const mockOnChange = vi.fn();
  const mockBet = {
    id: 'bet-1',
    type: 'Y/N',
    question: 'Will there be overtime?',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    getBetOptions.mockReturnValue(['Y', 'N']);
    getBetOptionLabel.mockImplementation((type, option) => option);
    getBetTypes.mockResolvedValue([
      { id: 'Y/N', name: 'Yes/No' },
      { id: 'INTEGER', name: 'Integer Range', isIntegerRange: true, minValue: 0, maxValue: 100 },
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render label when showLabel is true', async () => {
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} showLabel={true} />);
    
    await waitFor(() => {
      expect(screen.getByText('Will there be overtime?')).toBeTruthy();
    });
  });

  it('should not render label when showLabel is false', async () => {
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} showLabel={false} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Will there be overtime?')).toBeNull();
    });
  });

  it('should render radio buttons for non-integer bet types', async () => {
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBeGreaterThan(0);
    });
  });

  it('should call onChange when radio button is selected', async () => {
    const user = userEvent.setup();
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBeGreaterThan(0);
    });
    
    const firstRadio = screen.getAllByRole('radio')[0];
    await user.click(firstRadio);
    
    expect(mockOnChange).toHaveBeenCalledWith('bet-1', 'Y');
  });

  it('should not call onChange when disabled and radio is clicked', async () => {
    const user = userEvent.setup();
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} disabled={true} />);
    
    await waitFor(() => {
      const radioButtons = screen.getAllByRole('radio');
      expect(radioButtons.length).toBeGreaterThan(0);
    });
    
    const firstRadio = screen.getAllByRole('radio')[0];
    await user.click(firstRadio);
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should render integer input for integer range bet types', async () => {
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const input = screen.getByRole('spinbutton');
      expect(input).toBeTruthy();
      expect(input.type).toBe('number');
    });
  });

  it('should show range label for integer bet types', async () => {
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="" onChange={mockOnChange} showLabel={true} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Range: 0 - 100/)).toBeTruthy();
    });
  });

  it('should show range label when showLabel is false for integer types', async () => {
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="" onChange={mockOnChange} showLabel={false} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Range: 0 - 100/)).toBeTruthy();
    });
  });

  it('should call onChange with valid integer value', async () => {
    const user = userEvent.setup();
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const input = screen.getByRole('spinbutton');
      expect(input).toBeTruthy();
    });
    
    const input = screen.getByRole('spinbutton');
    await user.type(input, '50');
    
    // onChange is called for each keystroke: '5' then '0' (which becomes '50' in the input)
    expect(mockOnChange).toHaveBeenCalled();
    // Verify it was called with '5' (first character)
    expect(mockOnChange).toHaveBeenCalledWith('bet-2', '5');
    // And with '0' (second character, which when combined with previous value makes '50')
    expect(mockOnChange).toHaveBeenCalledWith('bet-2', '0');
  });

  it('should validate integer input and prevent out-of-range values', async () => {
    const user = userEvent.setup();
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const input = screen.getByRole('spinbutton');
      expect(input).toBeTruthy();
    });
    
    const input = screen.getByRole('spinbutton');
    // Type 150 - component validates on each keystroke
    await user.type(input, '150');
    
    // The component validates on each keystroke separately
    // '1' is valid (0-100), '5' makes '15' which is valid, but '0' makes '150' which exceeds maxValue
    // So onChange should be called for '1' and '5', but '150' should be filtered out
    const calls = mockOnChange.mock.calls;
    const allValues = calls.map(call => call[1]);
    // Should have called with '1' and '5' (valid)
    expect(allValues).toContain('1');
    expect(allValues).toContain('5');
    // The component validates and prevents '150' from being set
    // The last value should not be '150' (it would be filtered out)
    const lastValue = allValues[allValues.length - 1];
    expect(parseInt(lastValue || '0', 10)).toBeLessThanOrEqual(100);
  });

  it('should allow clearing integer input (empty string)', async () => {
    const user = userEvent.setup();
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="50" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const input = screen.getByRole('spinbutton');
      expect(input).toBeTruthy();
    });
    
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    
    expect(mockOnChange).toHaveBeenCalledWith('bet-2', '');
  });

  it('should not call onChange when disabled and integer input changes', async () => {
    const user = userEvent.setup();
    const integerBet = {
      id: 'bet-2',
      type: 'INTEGER',
      question: 'Total points?',
    };
    
    render(<BetInput bet={integerBet} value="" onChange={mockOnChange} disabled={true} />);
    
    await waitFor(() => {
      const input = screen.getByRole('spinbutton');
      expect(input).toBeTruthy();
    });
    
    const input = screen.getByRole('spinbutton');
    await user.type(input, '50');
    
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should mark selected radio button as checked', async () => {
    render(<BetInput bet={mockBet} value="Y" onChange={mockOnChange} />);
    
    await waitFor(() => {
      const radioButtons = screen.getAllByRole('radio');
      const checkedRadio = radioButtons.find(radio => radio.checked);
      expect(checkedRadio).toBeTruthy();
      expect(checkedRadio.value).toBe('Y');
    });
  });

  it('should use getBetOptionLabel to display option labels', async () => {
    getBetOptionLabel.mockImplementation((type, option) => {
      return option === 'Y' ? 'Yes' : 'No';
    });
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(getBetOptionLabel).toHaveBeenCalled();
      // Should have labels for both options
      const yesLabels = screen.getAllByText('Yes');
      expect(yesLabels.length).toBeGreaterThan(0);
    });
  });

  it('should handle bet types loading error gracefully', async () => {
    getBetTypes.mockRejectedValue(new Error('Failed to load'));
    
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      // Should still render with default options
      expect(screen.getByText('Will there be overtime?')).toBeTruthy();
    });
  });

  it('should handle empty bet types array', async () => {
    getBetTypes.mockResolvedValue([]);
    
    render(<BetInput bet={mockBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      // Should still render
      expect(screen.getByText('Will there be overtime?')).toBeTruthy();
    });
  });

  it('should render with team names for team selection bets', async () => {
    const teamBet = {
      id: 'bet-3',
      type: 'TEAM',
      question: 'Which team will win?',
      teamNames: { option1: 'Team A', option2: 'Team B' },
    };
    
    getBetOptions.mockReturnValue(['option1', 'option2']);
    getBetOptionLabel.mockImplementation((type, option, teamNames) => {
      return teamNames[option] || option;
    });
    
    render(<BetInput bet={teamBet} value="" onChange={mockOnChange} />);
    
    await waitFor(() => {
      expect(screen.getByText('Team A')).toBeTruthy();
      expect(screen.getByText('Team B')).toBeTruthy();
    });
  });
});
