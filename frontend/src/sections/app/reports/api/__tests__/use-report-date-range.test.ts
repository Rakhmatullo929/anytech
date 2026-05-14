import { renderHook, act } from '@testing-library/react';
import { useReportDateRange } from '../use-report-date-range';

const mockSetValues = jest.fn();
const mockValues = { date_from: '', date_to: '' };

jest.mock('src/hooks/use-url-query-state', () => ({
  useUrlQueryState: () => ({ values: mockValues, setValues: mockSetValues }),
  stringParam: (defaultValue: string) => defaultValue,
}));

describe('useReportDateRange', () => {
  beforeEach(() => {
    mockValues.date_from = '';
    mockValues.date_to = '';
    jest.clearAllMocks();
  });

  it('returns default dateFrom (30 days ago) when no URL param set', () => {
    const { result } = renderHook(() => useReportDateRange());
    const today = new Date();
    const expected = new Date(today);
    expected.setDate(expected.getDate() - 30);
    expect(result.current.dateFrom).toBe(expected.toISOString().slice(0, 10));
  });

  it('returns default dateTo (today) when no URL param set', () => {
    const { result } = renderHook(() => useReportDateRange());
    const today = new Date().toISOString().slice(0, 10);
    expect(result.current.dateTo).toBe(today);
  });

  it('uses URL param value when set for dateFrom', () => {
    mockValues.date_from = '2024-01-15';
    const { result } = renderHook(() => useReportDateRange());
    expect(result.current.dateFrom).toBe('2024-01-15');
  });

  it('uses URL param value when set for dateTo', () => {
    mockValues.date_to = '2024-02-28';
    const { result } = renderHook(() => useReportDateRange());
    expect(result.current.dateTo).toBe('2024-02-28');
  });

  it('exposes setValues for updating params', () => {
    const { result } = renderHook(() => useReportDateRange());
    act(() => {
      result.current.setValues({ date_from: '2024-03-01' });
    });
    expect(mockSetValues).toHaveBeenCalledWith({ date_from: '2024-03-01' });
  });
});
