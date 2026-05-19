import { render, screen, fireEvent } from 'src/test-utils';
import DateRangeFilter from '../date-range-filter';

describe('DateRangeFilter', () => {
  const defaultProps = {
    dateFrom: '2024-01-01',
    dateTo: '2024-01-31',
    labelFrom: 'From',
    labelTo: 'To',
    onDateFromChange: jest.fn(),
    onDateToChange: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it('renders both date inputs', () => {
    render(<DateRangeFilter {...defaultProps} />);
    expect(screen.getByLabelText('From')).toBeInTheDocument();
    expect(screen.getByLabelText('To')).toBeInTheDocument();
  });

  it('displays the initial dateFrom value', () => {
    render(<DateRangeFilter {...defaultProps} />);
    expect(screen.getByLabelText('From')).toHaveValue('2024-01-01');
  });

  it('displays the initial dateTo value', () => {
    render(<DateRangeFilter {...defaultProps} />);
    expect(screen.getByLabelText('To')).toHaveValue('2024-01-31');
  });

  it('calls onDateFromChange when from date changes', () => {
    render(<DateRangeFilter {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('From'), { target: { value: '2024-02-01' } });
    expect(defaultProps.onDateFromChange).toHaveBeenCalledWith('2024-02-01');
  });

  it('calls onDateToChange when to date changes', () => {
    render(<DateRangeFilter {...defaultProps} />);
    fireEvent.change(screen.getByLabelText('To'), { target: { value: '2024-02-28' } });
    expect(defaultProps.onDateToChange).toHaveBeenCalledWith('2024-02-28');
  });

  it('renders both inputs as type=date', () => {
    render(<DateRangeFilter {...defaultProps} />);
    expect(screen.getByLabelText('From').getAttribute('type')).toBe('date');
    expect(screen.getByLabelText('To').getAttribute('type')).toBe('date');
  });
});
