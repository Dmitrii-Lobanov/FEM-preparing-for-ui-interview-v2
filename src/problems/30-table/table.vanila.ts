import { AbstractComponent, type TComponentConfig } from '@course/utils'
import styles from './table.module.css'
import flex from '@course/styles'
import cx from '@course/cx'

export interface TTableDataSource<T> {
  pageSize: number
  pages: number
  next: (page: number, pageSize: number) => Promise<T[]>
}

export type TTableColumn<T> = {
  id: string
  name: string
  renderer: (item: T) => string
  sort?: 'asc' | 'desc' | 'none'
}

export type TTableProps<T> = {
  columns: TTableColumn<T>[]
  datasource: TTableDataSource<T>
  search?: (query: string, data: T[]) => T[]
  comparator?: (columnId: keyof T, direction: 'asc' | 'desc') => (a: T, b: T) => number
}

/**
 * Expected input:
 * {
 *   columns: [{ id, name, renderer, sort? }],
 *   datasource: { pageSize, pages, next },
 *   search: (query, data) => filteredData,
 *   comparator: (columnId, direction) => compareFn
 * }
 *
 * Step 1: Extend AbstractComponent<TTableProps<T>>
 * - Call super() with config, adding:
 *   - className: [cx(flex.w100, flex.flexColumnStart)]
 *   - listeners: ['click', 'input']
 * - Store private fields: tbody, prevBtn, nextBtn, pageInfo (DOM refs)
 * - Store private state: data (T[]), currentPage (number), query (string),
 *   sort ({ columnId, direction } | null)
 * - Call initData() to fetch initial page
 *
 * Step 2: Implement data fetching
 * - initData: if data is empty, fetch page 0 via datasource.next, store result, call renderState
 * - fetchNext: if not on last page, increment currentPage; if data not yet fetched, call datasource.next and append; call renderState
 * - fetchPrev: decrement currentPage (min 0), call renderState
 *
 * Step 3: Implement setQuery and setSort
 * - setQuery: update query, reset currentPage to 0, call renderState
 * - setSort: update sort state, call renderState
 *
 * Step 4: Implement getSlice
 * - Filter data using search prop (or fallback to Object.values string matching)
 * - Sort filtered data using comparator prop if sort is active
 * - Slice to current page window
 * - Chain: [filterFn, sortFn, sliceFn].reduce(...)
 *
 * Step 5: Implement event handlers
 * - onClick: check for th click (read data-column-id, cycle sort direction: none→asc→desc→none)
 *   and button clicks (Prev/Next)
 * - onInput: check for search input, call setQuery
 *
 * Step 6: Implement renderState helpers
 * - renderState: calls renderRows, renderPagination, updateHeaderSortIcons
 * - renderRows: set tbody.innerHTML from getSlice() using column renderers
 * - renderPagination: update button disabled states and page info text
 * - updateHeaderSortIcons: update th text with sort arrows (↑/↓)
 *
 * Step 7: Implement afterRender
 * - Query and store DOM refs: tbody, prevBtn, nextBtn, pageInfo
 * - If data already loaded, call renderState
 *
 * Step 8: Implement toHTML
 * - Return <table> with <thead> (th elements with data-column-id, sort indicators)
 *   and empty <tbody>
 * - Controls div: Prev button (disabled), page info span, Next button, search input
 */
export class Table<T extends { id: string }> extends AbstractComponent<TTableProps<T>> {
  constructor(config: TComponentConfig<TTableProps<T>>) {
    super(config)
  }

  toHTML(): string {
    return '<div>TODO: Implement</div>'
  }
}
