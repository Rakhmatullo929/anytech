import { render, screen } from 'src/test-utils';
import TopDebtorsPaginatedTable from '../top-debtors-paginated-table';

jest.mock('src/locales', () => ({
  useLocales: () => ({ tx: (key: string) => key }),
}));

jest.mock('src/components/settings', () => ({
  useSettingsContext: () => ({ onChangeDirectionByLang: jest.fn() }),
}));

const mockUseTopDebtorsQuery = jest.fn();
jest.mock('../../api', () => ({
  useTopDebtorsQuery: (...args: unknown[]) => mockUseTopDebtorsQuery(...args),
}));

jest.mock('src/components/table', () => ({
  TableHeadCustom: ({ headLabel }: { headLabel: { label: string }[] }) => (
    <thead>
      <tr>{headLabel.map((h) => <th key={h.label}>{h.label}</th>)}</tr>
    </thead>
  ),
  TableNoData: ({ notFound, title }: { notFound: boolean; title: string }) =>
    notFound ? <tr><td>{title}</td></tr> : null,
  TablePaginationCustom: ({ count }: { count: number }) => <div data-testid="pagination">{count}</div>,
  TableSkeleton: () => <tr><td>loading...</td></tr>,
}));

describe('TopDebtorsPaginatedTable', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows skeleton rows while pending with no data', () => {
    mockUseTopDebtorsQuery.mockReturnValue({ data: undefined, isPending: true, isFetching: false });
    render(<TopDebtorsPaginatedTable />);
    expect(screen.getAllByText('loading...').length).toBeGreaterThan(0);
  });

  it('shows no-data message when results are empty', () => {
    mockUseTopDebtorsQuery.mockReturnValue({
      data: { results: [], count: 0 },
      isPending: false,
      isFetching: false,
    });
    render(<TopDebtorsPaginatedTable />);
    expect(screen.getByText('common.table.noData')).toBeInTheDocument();
  });

  it('renders debtor rows when data is present', () => {
    mockUseTopDebtorsQuery.mockReturnValue({
      data: {
        results: [
          { id: '1', name: 'Alice', phone: '+1234', remaining: '500.00' },
          { id: '2', name: 'Bob', phone: '+5678', remaining: '200.00' },
        ],
        count: 2,
      },
      isPending: false,
      isFetching: false,
    });
    render(<TopDebtorsPaginatedTable />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('shows pagination with total count', () => {
    mockUseTopDebtorsQuery.mockReturnValue({
      data: { results: [], count: 42 },
      isPending: false,
      isFetching: false,
    });
    render(<TopDebtorsPaginatedTable />);
    expect(screen.getByTestId('pagination')).toHaveTextContent('42');
  });
});
