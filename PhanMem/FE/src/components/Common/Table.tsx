import React from 'react';
import { Loading } from './Loading';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyText?: string;
}

export function Table<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyText = 'Không có dữ liệu hiển thị',
}: TableProps<T>) {
  return (
    <div className="w-full h-full min-h-0 overflow-auto select-text premium-table-container rounded-xl">
      <table className="w-full border-collapse text-left text-sm text-slate-500">
        <thead className="sticky top-0 z-20 shadow-xs">
          <tr>
            {columns.map((column, idx) => (
              <th
                key={idx}
                className={`sticky top-0 z-20 bg-slate-50/95 backdrop-blur-md px-6 py-4 font-bold select-none border-b border-slate-200 text-xs text-slate-500 uppercase tracking-wider ${column.className || ''}`}
              >
                <span>{column.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100/80">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <Loading text="Đang tải dữ liệu..." />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center">
                <EmptyState message={emptyText} />
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="hover:bg-slate-50/50 transition duration-150"
              >
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className={`px-6 py-3.5 text-xs font-medium text-slate-600 ${column.className || ''}`}>
                    {column.render ? (
                      column.render(row, rowIdx)
                    ) : (
                      String(row[column.key as keyof T] || '')
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
