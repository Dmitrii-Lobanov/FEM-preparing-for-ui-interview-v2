import React, { useEffect, useMemo, useState } from 'react'
import styles from './table.module.css'
import flex from '@course/styles'
import cx from '@course/cx'

type TSortDir = 'asc' | 'desc' | 'none'

const PAGE_SIZE = 5;

export interface TTableDataSource<T> {
  pageSize: number
  pages: number
  next: (page: number, pageSize: number) => Promise<T[]>
}

export type TTableColumn<T> = {
  id: string
  name: string
  renderer: (item: T) => React.ReactNode
}

type TTableProps<T extends { id: string }> = {
  columns: TTableColumn<T>[]
  datasource: TTableDataSource<T>
  search?: (query: string, data: T[]) => T[]
  comparator?: (columnId: keyof T, direction: 'asc' | 'desc') => (a: T, b: T) => number
}

const nextDir = { none: 'asc', asc: 'desc', desc: 'none' } as const

type TSort<T> = {
  id: keyof T
  dir: TSortDir
}

export function Table<T extends { id: string }>({
  search,
  columns,
  datasource,
  comparator,
}: TTableProps<T>) {
  // Step 1: Set up state
  // - query (string, default '')
  // - data (T[], default [])
  // - currentPage (number, default 0)
  // - sort ({ columnId, direction } | null, default null)
  const [query, setQuery] = useState('');
  const [data, setData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [sort, setSort] = useState<TSort<T> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Step 2: Fetch initial data
  // - useEffect on datasource change: reset data and currentPage, fetch page 0
  useEffect(() => {
    if (data.length >= (currentPage + 1) * PAGE_SIZE) {
      return;
    }

    let cancelled = false;

    setIsLoading(true);

    datasource.next(currentPage, PAGE_SIZE).then((data) => {
      if (cancelled) {
        return;
      }

      setData((prev) => [...prev, ...data]);
    },
    (err) => {
      throw err;
    }
  ).finally(() => {
    setIsLoading(false);
  });

    return () => {
      cancelled = true;
    }
  }, [datasource, currentPage, data.length]);

  // Step 3: Implement pagination handlers
  // - next: if not on last page, increment currentPage; if data not yet fetched, call datasource.next and append
  // - prev: decrement currentPage (min 0)
  const next = () => {
    setCurrentPage((prev) => prev + 1);
  }

  const prev = () => {
    setCurrentPage((prev) => prev - 1);
  }

  // Step 4: Implement search handler
  const searchHandler = (data: T[], query: string): T[] => {
    if (!query) {
      return data;
    }

    if (search) {
      return search(query, data);
    }

    return data.filter((item) => item.id.includes(query));
  }

  // Step 5: Implement sort handler
  // - onSort: read data-column-id from clicked th element
  // - Cycle direction: none → asc → desc → none
  // - Update sort state
  const onSort: React.MouseEventHandler<HTMLElement> = ({ target }) => {
    if (target instanceof HTMLElement && target.dataset.id) {
      const { id: columnId } = target.dataset;

      setSort({
        id: columnId as keyof T,
        dir: nextDir[sort?.dir ?? 'none']
      })
    }
  }

  // Step 6: Compute displayed slice with useMemo
  // - Filter data using search prop (or fallback to id.includes)
  // - Sort filtered data using comparator prop if sort is active
  // - Slice to current page window

  const compute = (): T[] => {
    const filtered = searchHandler(data, query);

    const sorted = sort && comparator && sort.dir && sort.dir !== 'none' 
      ? filtered.toSorted(comparator(sort.id, sort.dir)) 
      : filtered;

    return sorted.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
  }

  const chunk = compute();

  // Step 7: Render
  // - <table> with <thead> (column headers with sort indicators and data-column-id)
  // - <tbody> with rows from slice, using column renderers
  // - Controls: Prev/Next buttons (disabled at boundaries), page info, search input

  const content = chunk.map((item) => (
    <tr key={item.id}>
      {columns.map((column) => <td key={column.id}>{column.renderer(item)}</td>)}
    </tr>
  ))

  return <div>
    <table>
      <thead onClick={onSort}>
        <tr>
          {columns.map((column) => <th key={column.id} data-id={column.id}>{column.name}</th>)}
        </tr>
      </thead>

      <tbody>
        {content}
      </tbody>
    </table>

    <div>
      {isLoading ? 'Loading...' : ''}
    </div>

    <div>
      <button disabled={currentPage === 0} onClick={prev}>
        Prev
      </button>

      <button disabled={currentPage === datasource.pages - 1} onClick={next}>
        Next
      </button>

      <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />
    </div>
  </div>
}
