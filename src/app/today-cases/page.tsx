"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import toast from "react-hot-toast";
import { format, isValid } from "date-fns";
import Link from "next/link";
import { EnhancedDataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Scale, Clock, TrendingUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ColumnDef } from "@tanstack/react-table";

interface TodayCase {
  id: string;
  client_id: string;
  sr_no: number;
  case_title: string;
  case_description: string | null;
  computer_code: string | null;
  previous_date: string[] | null; // JSONB array
  case_proceeding: string | null;
  next_date: string | null;
  court_name: string | null;
  case_decision: string | null;
  status: string;
  client_name: string;
}

export default function TodayCasesPage() {
  const [cases, setCases] = useState<TodayCase[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, completed: 0 });
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  const columns: ColumnDef<TodayCase>[] = [
    {
      accessorKey: "case_title",
      header: "Case Title",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Scale className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-gray-900">
            {row.getValue("case_title") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "computer_code",
      header: "Computer Code",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">
            {row.getValue("computer_code") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "previous_date",
      header: "Previous Date",
      cell: ({ row }) => {
        const dates = row.getValue("previous_date") as string[] | null;
        if (!dates || !Array.isArray(dates) || dates.length === 0) {
          return <span className="text-gray-400">N/A</span>;
        }
        try {
          const formatted = dates
            .filter((date) => isValid(new Date(date)))
            .map((date) => format(new Date(date), "MMM dd, yyyy"))
            .join(", ");
          return formatted ? (
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-gray-600">{formatted}</span>
            </div>
          ) : (
            <span className="text-gray-400">N/A</span>
          );
        } catch (error) {
          console.error("Error formatting previous dates:", error);
          return <span className="text-gray-400">Invalid dates</span>;
        }
      },
    },
    {
      accessorKey: "client_name",
      header: "Client",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">
            {row.getValue("client_name") || "Unknown Client"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "court_name",
      header: "Court",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">
            {row.getValue("court_name") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "case_proceeding",
      header: "Proceeding",
      cell: ({ row }) => {
        const proceeding = row.getValue("case_proceeding") as string | null;
        return proceeding ? (
          <Badge variant="secondary" className="bg-blue-50 text-blue-700">
            {proceeding}
          </Badge>
        ) : (
          <span className="text-gray-400">N/A</span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        const statusColors = {
          Active: "bg-green-100 text-green-800",
          Closed: "bg-gray-100 text-gray-800",
          Pending: "bg-yellow-100 text-yellow-800",
        };
        return (
          <Badge
            className={
              statusColors[status as keyof typeof statusColors] ||
              "bg-gray-100 text-gray-800"
            }
          >
            {status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/clients/${row.original.client_id}/cases`}>
            <Button
              variant="ghost"
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Eye className="w-4 h-4" />
              <span className="ml-2">View</span>
            </Button>
          </Link>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadCasesForDate();
  }, [selectedDate]);

  async function loadCasesForDate() {
    setLoading(true);
    console.log("Querying cases for date:", selectedDate);

    // Query cases where the selected date matches either:
    // 1. The next_date field, OR
    // 2. Any date in the previous_date JSONB array
    const { data, error } = await supabase
      .from("cases")
      .select(
        `
      *,
      clients!inner(name)
    `
      )
      .or(`next_date.eq.${selectedDate},previous_date.cs.["${selectedDate}"]`);

    if (error) {
      console.error("Error fetching cases:", error);
      toast.error("Failed to load cases: " + error.message);
    } else {
      console.log("Raw data from Supabase:", data);
      const casesWithClientNames = (data || []).map((caseItem) => ({
        ...caseItem,
        previous_date: Array.isArray(caseItem.previous_date)
          ? caseItem.previous_date
          : caseItem.previous_date
          ? [caseItem.previous_date]
          : [],
        client_name: caseItem.clients?.name || "Unknown Client",
      }));
      console.log("Formatted cases:", casesWithClientNames);
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    if (newDate && isValid(new Date(newDate))) {
      setSelectedDate(newDate);
    } else {
      toast.error("Please select a valid date");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex justify-center items-center gap-3">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h1 className="bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-transparent text-4xl">
            Cases for Selected Date
          </h1>
        </div>
        <div className="flex justify-center items-center gap-4">
          <Input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-48"
          />
          <p className="text-gray-600 text-lg">
            {isValid(new Date(selectedDate))
              ? format(new Date(selectedDate), "EEEE, MMMM do, yyyy")
              : "Select a date"}
          </p>
        </div>
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
            Cases Scheduled for{" "}
            {isValid(new Date(selectedDate))
              ? format(new Date(selectedDate), "MMMM do, yyyy")
              : "Selected Date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="border-b-2 border-blue-600 rounded-full w-12 h-12 animate-spin"></div>
              <span className="ml-3 text-gray-600">Loading cases...</span>
            </div>
          ) : cases.length === 0 ? (
            <div className="py-12 text-gray-600 text-center">
              No cases scheduled for{" "}
              {isValid(new Date(selectedDate))
                ? format(new Date(selectedDate), "MMMM do, yyyy")
                : "the selected date"}
              .
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
