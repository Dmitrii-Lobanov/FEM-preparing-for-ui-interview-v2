import React, {useEffect, useMemo, useState} from 'react'
import styles from './table.module.css'
import flex from '@course/styles'
import cx from '@course/cx'

type TSortDir = 'asc' | 'desc' | 'none'

export interface TTableDataSource<T> {
    pageSize: number
    pages: number
    next: (page: number, pageSize: number) => Promise<T[]>
}

export type TTableColumn<T> = {
    id: string
    name: string
    renderer: (item: T) => React.ReactNode
    sort?: TSortDir
}

type TTableProps<T extends { id: string }> = {
    columns: TTableColumn<T>[]
    datasource: TTableDataSource<T>
    search?: (query: string, data: T[]) => T[]
    comparator?: (columnId: keyof T, direction: 'asc' | 'desc') => (a: T, b: T) => number
}

const nextDir = {none: 'asc', asc: 'desc', desc: 'none'} as const

type TSort<T> = {
    id: keyof T,
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

    // Step 2: Fetch initial data
    // - useEffect on datasource change: reset data and currentPage, fetch page 0

    // Step 3: Implement pagination handlers
    // - next: if not on last page, increment currentPage; if data not yet fetched, call datasource.next and append
    // - prev: decrement currentPage (min 0)
    const next = () => {};
    const prev = () => {};

    // Step 4: Implement search handler
    const searchHandler = (data: T[], query: string): T[] => {
        return [];
    }
    
    // Step 5: Implement sort handler
    // - onSort: read data-column-id from clicked th element
    // - Cycle direction: none → asc → desc → none
    // - Update sort state
    const onSort: React.MouseEventHandler<HTMLElement> = ({target}) => {
        // todo
    }

    // Step 6: Compute displayed slice with useMemo
    // - Filter data using search prop (or fallback to id.includes)
    // - Sort filtered data using comparator prop if sort is active
    // - Slice to current page window

    const compute = (): T[] => {};

    // Step 7: Render
    // - <table> with <thead> (column headers with sort indicators and data-column-id)
    // - <tbody> with rows from slice, using column renderers
    // - Controls: Prev/Next buttons (disabled at boundaries), page info, search input

    return <div>TODO: Implement</div>
}
