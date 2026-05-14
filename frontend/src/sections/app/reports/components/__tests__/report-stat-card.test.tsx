import { render, screen } from 'src/test-utils';
import ReportStatCard from '../stat-card';

describe('ReportStatCard', () => {
  it('renders title and value', () => {
    render(<ReportStatCard title="Total Revenue" value="$1,200" />);
    expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    expect(screen.getByText('$1,200')).toBeInTheDocument();
  });

  it('shows dash when loading with no value', () => {
    render(<ReportStatCard title="Revenue" value="" loading />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows value even when loading if value is provided', () => {
    render(<ReportStatCard title="Revenue" value="500" loading />);
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('renders a LinearProgress bar when loading', () => {
    const { container } = render(<ReportStatCard title="T" value="V" loading />);
    expect(container.querySelector('.MuiLinearProgress-root')).toBeInTheDocument();
  });

  it('does not render progress bar when not loading', () => {
    const { container } = render(<ReportStatCard title="T" value="V" />);
    expect(container.querySelector('.MuiLinearProgress-root')).not.toBeInTheDocument();
  });

  it('renders numeric values', () => {
    render(<ReportStatCard title="Count" value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
