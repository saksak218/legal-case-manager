"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Column {
  accessorKey: string;
  header: string;
  cell?: (args: any) => React.ReactNode;
}

interface EnhancedDataTableProps {
  data: any[];
  columns: Column[];
  caption?: string;
  rowsPerPage?: number;
  searchPlaceholder?: string;
}

export function EnhancedDataTable({
  data,
  columns,
  caption,
  rowsPerPage = 5,
  searchPlaceholder,
}: EnhancedDataTableProps) {
  const [page, setPage] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce effect
  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  // Filter with debounced query
  const filteredData = React.useMemo(() => {
    if (!debouncedQuery) return data;
    const q = debouncedQuery.toLowerCase();
    return data.filter((item) =>
      Object.values(item).some(
        (v) => typeof v === "string" && v.toLowerCase().includes(q)
      )
    );
  }, [data, debouncedQuery]);

  const source = debouncedQuery ? filteredData : data;

  const paginatedData = React.useMemo(() => {
    const start = page * rowsPerPage;
    return source.slice(start, start + rowsPerPage);
  }, [source, page, rowsPerPage]);

  function renderCell(column: Column, rowData: any) {
    if (!column.cell) {
      return rowData[column.accessorKey] ?? null;
    }

    const arg = {
      ...rowData,
      row: {
        original: rowData,
        getValue: (key: string) => rowData[key],
      },
    };

    try {
      return column.cell(arg);
    } catch {
      return column.cell(rowData);
    }
  }

  // Reset page when data or query changes
  React.useEffect(() => {
    setPage(0);
  }, [data, debouncedQuery, rowsPerPage]);

  return (
    <div className="overflow-x-auto">
      {searchPlaceholder && (
        <div className="flex justify-end mb-3">
          <div className="w-full sm:max-w-xs">
            <input
              type="search"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-3 py-2 border rounded w-full"
            />
          </div>
        </div>
      )}

      <Table className="my-6">
        {caption && <TableCaption>{caption}</TableCaption>}

        <TableHeader>
          <TableRow>
            {columns.map((column, i) => (
              <TableHead key={i} className="text-xl">
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {paginatedData.map((row, rowIndex) => (
            <TableRow
              key={row.id ?? `${page}-${rowIndex}`}
              className="hover:bg-blue-50/50 border-gray-100/50 border-b text-gray-600 transition-colors"
            >
              {columns.map((column) => (
                <TableCell
                  className="px-4 py-6 border border-gray-300 font-medium text-xl"
                  key={`${row.id ?? rowIndex}-${column.accessorKey}`}
                >
                  {renderCell(column, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="bg-gray-200 disabled:opacity-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded text-gray-500 cursor-pointer disabled:cursor-no-drop"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          <ArrowLeft />
        </button>
        <span className="text-sm sm:text-base">
          Page {page + 1} of{" "}
          {Math.max(1, Math.ceil(source.length / rowsPerPage))}
        </span>
        <button
          className="bg-gray-200 disabled:opacity-50 px-2 sm:px-3 py-0.5 sm:py-1 rounded text-gray-500 cursor-pointer disabled:cursor-no-drop"
          onClick={() =>
            setPage((p) => ((p + 1) * rowsPerPage < source.length ? p + 1 : p))
          }
          disabled={(page + 1) * rowsPerPage >= source.length}
        >
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
