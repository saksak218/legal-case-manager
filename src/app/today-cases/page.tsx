"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { format } from "date-fns";
import Link from "next/link";
import { EnhancedDataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Scale, Clock, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
  client_name?: string;
}

export default function TodayCasesPage() {
  const [cases, setCases] = useState<TodayCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });

  const columns = [
    // { accessorKey: "sr_no", header: "Sr. No" },
    { accessorKey: "case_title", header: "Case Title" },
    { accessorKey: "computer_code", header: "Computer Code" },
    { accessorKey: "previous_date", header: "Previous Date" },
    { accessorKey: "client_name", header: "Client" },
    { accessorKey: "court_name", header: "Court" },
    { accessorKey: "case_proceeding", header: "Proceeding" },
    // { accessorKey: "status", header: "Status" },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: (row: TodayCase) => (
        <div className="flex gap-2 text-black">
          <Link
            href={`/clients/${row.client_id}/cases`}
            className="font-medium text-black"
          >
            <Button
              variant="ghost"
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black"
            >
              <Eye />
              View
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadTodayCases();
  }, []);

  async function loadTodayCases() {
    setLoading(true);
    const today = format(new Date(), "yyyy-MM-dd");

    const { data, error } = await supabase
      .from("cases")
      .select(
        `
        *,
        clients!inner(name)
      `
      )
      .eq("next_date", today);

    if (error) {
      toast.error("Failed to load today's cases");
    } else {
      const casesWithClientNames = (data || []).map((caseItem) => ({
        ...caseItem,
        client_name: caseItem.clients?.name || "Unknown Client",
      }));
      setCases(casesWithClientNames);

      // Calculate stats
      const total = casesWithClientNames.length;
      const active = casesWithClientNames.filter(
        (c) => c.status === "Active"
      ).length;
      const completed = casesWithClientNames.filter(
        (c) => c.status === "Closed"
      ).length;
      setStats({ total, active, completed });
    }
    setLoading(false);
  }

  //   console.log(row);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex justify-center items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-transparent text-4xl">
            Today's Cases
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-600">Total Cases</p>
                <p className="font-bold text-blue-800 text-3xl">
                  {stats.total}
                </p>
              </div>
              <Scale className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-green-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-green-600">Active Cases</p>
                <p className="font-bold text-green-800 text-3xl">
                  {stats.active}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-purple-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-purple-600">Completed</p>
                <p className="font-bold text-purple-800 text-3xl">
                  {stats.completed}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card className="bg-white/80 shadow-2xl backdrop-blur-sm border-white/20">
        <CardHeader>
          <CardTitle className="font-semibold text-gray-800 text-2xl">
            Cases Scheduled for Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="border-b-2 border-blue-600 rounded-full w-12 h-12 animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading cases...</span>
            </div>
          ) : (
            <EnhancedDataTable
              columns={columns}
              data={cases}
              searchPlaceholder="Search cases, clients, courts..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
