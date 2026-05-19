import { render, screen } from 'src/test-utils';
import ReportChartCard from '../report-chart-card';

describe('ReportChartCard', () => {
  it('renders the title', () => {
    render(
      <ReportChartCard title="Top Products">
        <div>chart content</div>
      </ReportChartCard>
    );
    expect(screen.getByText('Top Products')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ReportChartCard title="T">
        <span>child node</span>
      </ReportChartCard>
    );
    expect(screen.getByText('child node')).toBeInTheDocument();
  });

  it('shows LinearProgress when isFetching and hasPreviousData', () => {
    const { container } = render(
      <ReportChartCard title="T" isFetching hasPreviousData>
        <div />
      </ReportChartCard>
    );
    expect(container.querySelector('.MuiLinearProgress-root')).toBeInTheDocument();
  });

  it('does not show LinearProgress when not fetching', () => {
    const { container } = render(
      <ReportChartCard title="T" isFetching={false} hasPreviousData>
        <div />
      </ReportChartCard>
    );
    expect(container.querySelector('.MuiLinearProgress-root')).not.toBeInTheDocument();
  });

  it('does not show LinearProgress when fetching but no previous data', () => {
    const { container } = render(
      <ReportChartCard title="T" isFetching hasPreviousData={false}>
        <div />
      </ReportChartCard>
    );
    expect(container.querySelector('.MuiLinearProgress-root')).not.toBeInTheDocument();
  });
});
