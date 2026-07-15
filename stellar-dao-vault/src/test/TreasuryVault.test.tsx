import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TreasuryVault from '../components/TreasuryVault';

describe('TreasuryVault', () => {
  const defaultProps = {
    vaultBalance: 50000,
    voterDeposit: 2000,
    onDeposit: () => {},
    onWithdraw: () => {},
    isActionActive: false,
    disabled: false,
  };

  it('renders vault balance and voter deposit correctly', () => {
    render(<TreasuryVault {...defaultProps} />);
    expect(screen.getByText('50,000')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
    expect(screen.getByText('XLM')).toBeInTheDocument();
  });

  it('renders deposit and withdraw buttons', () => {
    render(<TreasuryVault {...defaultProps} />);
    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
  });

  it('disables inputs when disabled prop is true', () => {
    render(<TreasuryVault {...defaultProps} disabled={true} />);
    const input = screen.getByPlaceholderText('Enter token amount');
    expect(input).toBeDisabled();
  });

  it('disables withdraw when voter deposit is 0', () => {
    render(<TreasuryVault {...defaultProps} voterDeposit={0} />);
    const withdrawBtn = screen.getByText('Withdraw');
    expect(withdrawBtn).toBeDisabled();
  });

  it('calls onDeposit with parsed numeric value', () => {
    let depositedAmount = 0;
    const onDeposit = (amt: number) => { depositedAmount = amt; };
    render(<TreasuryVault {...defaultProps} onDeposit={onDeposit} />);

    const input = screen.getByPlaceholderText('Enter token amount');
    fireEvent.change(input, { target: { value: '500' } });

    const depositBtn = screen.getByText('Deposit');
    fireEvent.click(depositBtn);

    expect(depositedAmount).toBe(500);
  });
});
