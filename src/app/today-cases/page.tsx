"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TodayCase {
  id: string;
  client_id: string;
  sr_no: number;
  case_title: string;
  case_description: string;
  computer_code: string;
  previous_date: string | null;
  case_proceeding: string | null;
  next_date: string | null;
  court_name: string;
  case_decision: string | null;
  status: string;
}

const columns: ColumnDef<TodayCase>[] = [
  { accessorKey: "sr_no", header: "Sr. No" },
  { accessorKey: "case_title", header: "Title" },
  { accessorKey: "case_description", header: "Description" },
  { accessorKey: "computer_code", header: "Computer Code" },
  { accessorKey: "previous_date", header: "Previous Date" },
  { accessorKey: "case_proceeding", header: "Proceeding" },
  { accessorKey: "next_date", header: "Next Date" },
  { accessorKey: "court_name", header: "Court Name" },
  { accessorKey: "case_decision", header: "Decision" },
  { accessorKey: "status", header: "Status" },
  {
    id: "actions",
    cell: ({ row }) => (
      <Link
        href={`/clients/${row.original.client_id}/cases`}
        className="text-blue-500 hover:underline"
      >
        View Client
      </Link>
    ),
  },
];

export default function TodayCasesPage() {
  const [cases, setCases] = useState<TodayCase[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTodayCases();
  }, []);

  async function loadTodayCases() {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("next_date", today);
    if (error) {
      toast.error("Failed to load today's cases");
    } else {
      setCases(data || []);
    }
    setLoading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Cases</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable columns={columns} data={cases} />
        )}
      </CardContent>
    </Card>
  );
}
