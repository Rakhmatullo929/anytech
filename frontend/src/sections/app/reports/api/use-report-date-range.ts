import { stringParam, useUrlQueryState } from 'src/hooks/use-url-query-state';

function defaultDateFrom() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultDateTo() {
  return new Date().toISOString().slice(0, 10);
}

export function useReportDateRange() {
  const { values, setValues } = useUrlQueryState({
    date_from: stringParam(''),
    date_to: stringParam(''),
  });

  return {
    dateFrom: (values.date_from as string) || defaultDateFrom(),
    dateTo: (values.date_to as string) || defaultDateTo(),
    setValues,
  };
}
