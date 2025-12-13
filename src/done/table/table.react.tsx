import React, { type ChangeEventHandler, useEffect, useEffectEvent, useRef, useState, useDeferredValue, useMemo } from 'react';
import { fetchStocks, type TPaginatedAPIResponse, type Stock } from './api';
import styles from './table.module.css';
import flex from '../../utilities/flex.module.css'
import { cx } from '../../utilities/utility';


type TTableColumn<T> = {
    id: string,
    name: string,
    renderer: (item: T) => React.ReactNode
    sort?: 'asc' | 'desc' | 'none'
}

type TTableProps<T> = {
    columns: TTableColumn<T>[],
    data: T[],
    next: () => void,
    prev: () => void,
    search: (query: string) => void,
    sort: (columnId: keyof T, direction: 'asc' | 'desc' | 'none') => void
    currentPage: number,
    totalPages: number
}


export function Table<T extends { id: string }>({ columns, data, next, prev, search, sort, currentPage, totalPages }: TTableProps<T>) {

    const onSearch: ChangeEventHandler<HTMLInputElement> = ({ target }) => search(target.value);

    const onSort: React.MouseEventHandler<HTMLTableSectionElement> = ({ target }) => {
        if (!(target instanceof HTMLElement) || !target.dataset.columnId) return;
        const columnId = target.dataset.columnId as keyof T;
        const column = columns.find((c) => c.id === columnId);
        if (!column) return;
        const newDirection = column.sort === 'desc' ? 'none' : column.sort === 'asc' ? 'desc' : 'asc';
        sort(columnId, newDirection);
    };

    return (
        <div className={styles.table}>
            <table>
                <thead onClickCapture={onSort}>
                    <tr>
                        {columns.map((c) => (
                            <th data-column-id={c.id} className={cx(flex.padding8)} key={c.id}>
                                {c.name}
                                {c.sort === 'asc' ? ' ↑' : c.sort === 'desc' ? ' ↓' : ''}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((item) => <tr key={item.id}>
                        {columns.map((col) => <td key={col.id} className={cx(flex.padding8)} >{col.renderer(item)}</td>)}
                    </tr>)}
                </tbody>
            </table>
            <div className={cx(flex.flexRow, flex.flexGap8)}>
                <button disabled={currentPage === 0} className={cx(flex.paddingHor8)} onClick={prev}>Prev</button>
                <span>{currentPage + 1} / {totalPages}</span>
                <button disabled={currentPage === totalPages - 1} className={cx(flex.paddingHor8)} onClick={next}>Next</button>
                <input type="search" placeholder="Filter" onChange={onSearch} />
            </div>
        </div>
    );
}

const COLUMNS: TTableColumn<Stock>[] = [
    { id: 'symbol', name: 'Symbol', renderer: (s) => s.symbol },
    { id: 'name', name: 'Name', renderer: (s) => s.name },
    { id: 'price', name: 'Price', renderer: (s) => `$${s.price.toFixed(2)}` },
    { id: 'change', name: 'Change', renderer: (s) => <span style={{ color: s.change >= 0 ? 'green' : 'red' }}>{s.change > 0 ? '+' : ''}{s.change.toFixed(2)}</span> },
    { id: 'changePercent', name: '% Change', renderer: (s) => <span style={{ color: s.changePercent >= 0 ? 'green' : 'red' }}>{s.changePercent.toFixed(2)}%</span> },
    { id: 'volume', name: 'Volume', renderer: (s) => s.volume },
    { id: 'marketCap', name: 'Market Cap', renderer: (s) => s.marketCap },
    { id: 'peRatio', name: 'P/E Ratio', renderer: (s) => s.peRatio },
];

const defaultComparator = (columnId: keyof Stock, direction: 'asc' | 'desc') => (a: Stock, b: Stock): number => {
    const modifier = direction === 'asc' ? 1 : -1;
    if (typeof a[columnId] === 'string' && typeof b[columnId] === 'string') {
        return a[columnId].localeCompare(b[columnId]) * modifier;
    }
    if (typeof a[columnId] === 'number' && typeof b[columnId] === 'number') {
        return (a[columnId] - b[columnId]) * modifier;
    }
    return 0;
}

export function TableExample() {
    const [columns, setColumns] = useState(COLUMNS);
    const [data, setData] = useState<TPaginatedAPIResponse<Stock>>({ data: [], total: 0, page: 0, pageSize: 0, totalPages: 0 });
    const [page, setPage] = useState(0);
    const [query, setQuery] = useState('');
    const defferedQuery = useDeferredValue(query);

    const intervalID = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

    const fetch = useEffectEvent(() => {
        fetchStocks(page).then(setData)
    });

    useEffect(() => {
        window.clearInterval(intervalID.current);
        fetch();
        intervalID.current = setInterval(fetch, 5000);
        return () => window.clearInterval(intervalID.current);
    }, [page]);

    const setSortedColumn = (columnId: keyof Stock, direction: 'asc' | 'desc' | 'none') => {
        setColumns((prev) => {
            return prev.map((c) => {
                if (c.id === columnId) {
                    return { ...c, sort: direction };
                }
                return { ...c, sort: 'none' };
            });
        });
    };

    const rows = data.data;

    const filteredData = useMemo(() => {
        return !defferedQuery ? rows : rows.filter((d) => Object.values(d).some(v => v.toString().toLowerCase().includes(defferedQuery.toLowerCase())));
    }, [data, defferedQuery]);


    const sortedData = useMemo(() => {
        const sortedColumn = columns.find((c) => c.sort !== 'none' && c.sort !== undefined);
        if (!sortedColumn || !sortedColumn.sort || sortedColumn.sort === 'none') return filteredData;
        return [...filteredData].sort(defaultComparator(sortedColumn.id as keyof Stock, sortedColumn.sort));
    }, [filteredData, columns]);


    return <Table
        columns={columns}
        data={sortedData}
        next={() => setPage(p => p + 1)}
        prev={() => setPage(p => Math.max(0, p - 1))}
        sort={setSortedColumn}
        search={setQuery}
        currentPage={page}
        totalPages={data.totalPages}
    />
}




