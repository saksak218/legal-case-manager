"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Pencil,
  Trash,
  Plus,
  Scale,
  FileText,
  Clock,
  DollarSign,
  Calendar,
  ArrowLeft,
  Building,
  User,
  Contact,
} from "lucide-react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ColumnDef } from "@tanstack/react-table";
import { EnhancedDataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Case {
  id: string;
  sr_no: number;
  case_title: string;
  case_description: string;
  computer_code: string;
  previous_date: string | null;
  case_proceeding: string | null;
  next_date: string | null;
  total_fee: number;
  received_fee: number;
  court_name: string;
  case_decision: string | null;
  status: string;
}

interface Client {
  id: string;
  name: string;
  contact_number: string;
  address: string;
}

const proceedingOptions = [
  "Summens",
  "Written statement",
  "Evidence of plaintiff",
  "Arguments",
  "Evidence of defendent",
  "Final arguments",
  "Order",
];

const decisionOptions = ["Decree", "Dismiss"];

const statusOptions = ["Active", "Closed", "Pending"];

const caseSchema = z.object({
  case_title: z.string().min(1, "Title is required"),
  case_description: z.string().optional(),
  computer_code: z.string().optional(),
  previous_date: z.string().optional(),
  case_proceeding: z.string().optional(),
  next_date: z.string().optional(),
  total_fee: z.number().min(0).optional(),
  received_fee: z.number().min(0).optional(),
  court_name: z.string().optional(),
  case_decision: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type CaseForm = z.infer<typeof caseSchema>;

export default function ClientCasesPage() {
  const { clientId } = useParams();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    totalFee: 0,
    receivedFee: 0,
    pendingFee: 0,
  });

  const form = useForm<CaseForm>({
    resolver: zodResolver(caseSchema),
    defaultValues: {
      case_title: "",
      case_description: "",
      computer_code: "",
      previous_date: "",
      case_proceeding: "",
      next_date: "",
      total_fee: 0,
      received_fee: 0,
      court_name: "",
      case_decision: "",
      status: "Active",
    },
  });

  const columns: ColumnDef<Case>[] = [
    // {
    //   accessorKey: "sr_no",
    //   header: "Sr. No",
    //   cell: ({ row }) => (
    //     <Badge variant="outline" className="bg-gray-50">
    //       #{row.getValue("sr_no")}
    //     </Badge>
    //   ),
    // },
    {
      accessorKey: "case_title",
      header: "Case Title",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <div>
            <p className="font-medium text-gray-900">
              {row.getValue("case_title")}
            </p>
            <p className="text-gray-500 text-sm">
              {row.original.computer_code}
            </p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "court_name",
      header: "Court",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-gray-400" />
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
        const proceeding = row.getValue("case_proceeding") as string;
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
      accessorKey: "next_date",
      header: "Next Date",
      cell: ({ row }) => {
        const date = row.getValue("next_date") as string;
        return date ? (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-green-600" />
            <span className="text-gray-600 text-sm">
              {format(date, "MMM dd, yyyy")}
            </span>
          </div>
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
      accessorKey: "total_fee",
      header: "Total fee",
      cell: ({ row }) => {
        const total = row.original.total_fee || 0;
        const received = row.original.received_fee || 0;
        const pending = total - received;
        return (
          <div className="text-sm">
            <div className="font-medium text-gray-900">
              Rs: {total.toLocaleString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "received_fee",
      header: "Received fee",
      cell: ({ row }) => {
        const received = row.original.received_fee || 0;
        return (
          <div className="text-sm">
            <div className="text-green-600">
              Rs: {received.toLocaleString()}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "pending_fee",
      header: "Pending fee",
      cell: ({ row }) => {
        const total = row.original.total_fee || 0;
        const received = row.original.received_fee || 0;
        const pending = total - received;
        return (
          <div className="text-sm">
            {pending > 0 && (
              <div className="text-red-600">Rs: {pending.toLocaleString()}</div>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openModal(row.original)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Pencil size={14} />
            {/* Edit */}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
          >
            <Trash size={14} />
            {/* Delete */}
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadClient();
    loadCases();
  }, [clientId]);

  async function loadClient() {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (error) {
      toast.error("Failed to load client details");
    } else {
      setClient(data);
    }
  }

  async function loadCases() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("client_id", clientId)
      .order("sr_no", { ascending: true });

    if (error) {
      toast.error("Failed to load cases");
    } else {
      setCases(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter((c) => c.status === "Active").length || 0;
      const closed = data?.filter((c) => c.status === "Closed").length || 0;
      const totalFee =
        data?.reduce((sum, c) => sum + (c.total_fee || 0), 0) || 0;
      const receivedFee =
        data?.reduce((sum, c) => sum + (c.received_fee || 0), 0) || 0;
      const pendingFee = totalFee - receivedFee;

      setStats({ total, active, closed, totalFee, receivedFee, pendingFee });
    }
    setLoading(false);
  }

  // async function handleSubmit(values: CaseForm) {
  //   setLoading(true);
  //   try {
  //     let updateData = { ...values, client_id: clientId };

  //     if (editingCase) {
  //       const { data: oldCase } = await supabase
  //         .from("cases")
  //         .select("next_date")
  //         .eq("id", editingCase.id)
  //         .single();
  //       if (oldCase && values.next_date !== oldCase.next_date) {
  //         updateData.previous_date = oldCase.next_date;
  //       }

  //       const { error } = await supabase
  //         .from("cases")
  //         .update(updateData)
  //         .eq("id", editingCase.id);
  //       if (error) throw error;
  //       toast.success("Case updated successfully");
  //     } else {
  //       // Get next sr_no
  //       const { data: maxSrNo } = await supabase
  //         .from("cases")
  //         .select("sr_no")
  //         .eq("client_id", clientId)
  //         .order("sr_no", { ascending: false })
  //         .limit(1)
  //         .single();

  //       // updateData.sr_no = (maxSrNo?.sr_no || 0) + 1;

  //       const { error } = await supabase.from("cases").insert(updateData);
  //       if (error) throw error;
  //       toast.success("Case added successfully");
  //     }
  //     setOpen(false);
  //     loadCases();
  //     form.reset();
  //   } catch (error) {
  //     console.log(error);
  //     toast.error("Operation failed");
  //   }
  //   setLoading(false);
  // }

  async function handleSubmit(values: CaseForm) {
    setLoading(true);
    try {
      let updateData = {
        ...values,
        client_id: clientId,
        previous_date: values.previous_date || null,
        next_date: values.next_date || null,
        total_fee:
          values.total_fee === null || isNaN(values.total_fee)
            ? null
            : values.total_fee,
        received_fee:
          values.received_fee === null || isNaN(values.received_fee)
            ? null
            : values.received_fee,
        case_description: values.case_description || null,
        computer_code: values.computer_code || null,
        case_proceeding: values.case_proceeding || null,
        court_name: values.court_name || null,
        case_decision: values.case_decision || null,
      };

      // Convert empty strings to null for all keys
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === "") {
          updateData[key] = null;
        }
      });

      console.log("Submitting:", updateData); // Debug

      if (editingCase) {
        const { data: oldCase } = await supabase
          .from("cases")
          .select("next_date")
          .eq("id", editingCase.id)
          .single();

        if (oldCase && values.next_date !== oldCase.next_date) {
          updateData.previous_date = oldCase.next_date;
        }

        const { error } = await supabase
          .from("cases")
          .update(updateData)
          .eq("id", editingCase.id);

        if (error) throw error;
        toast.success("Case updated successfully");
      } else {
        // Get next sr_no
        const { data: maxSrNo } = await supabase
          .from("cases")
          .select("sr_no")
          .eq("client_id", clientId)
          .order("sr_no", { ascending: false })
          .limit(1)
          .single();

        updateData.sr_no = (maxSrNo?.sr_no || 0) + 1;

        const { error } = await supabase.from("cases").insert(updateData);
        if (error) throw error;
        toast.success("Case added successfully");
      }

      setOpen(false);
      loadCases();
      form.reset();
    } catch (error) {
      console.log(error);
      toast.error("Operation failed");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this case?")) {
      setLoading(true);
      const { error } = await supabase.from("cases").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete case");
      } else {
        toast.success("Case deleted successfully");
        loadCases();
      }
      setLoading(false);
    }
  }

  function openModal(c?: Case) {
    if (c) {
      setEditingCase(c);
      form.reset({
        ...c,
        case_description: c.case_description || "",
        computer_code: c.computer_code || "",
        case_proceeding: c.case_proceeding || "",
        court_name: c.court_name || "",
        case_decision: c.case_decision || "",
        previous_date: c.previous_date
          ? format(c.previous_date, "yyyy-MM-dd")
          : "",
        next_date: c.next_date ? format(c.next_date, "yyyy-MM-dd") : "",
        total_fee: c.total_fee || 0,
        received_fee: c.received_fee || 0,
      });
    } else {
      setEditingCase(null);
      form.reset({
        case_title: "",
        case_description: "",
        computer_code: "",
        previous_date: "",
        case_proceeding: "",
        next_date: "",
        total_fee: 0,
        received_fee: 0,
        court_name: "",
        case_decision: "",
        status: "Active",
      });
    }
    setOpen(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Back to Clients
            </Button>
          </Link>
        </div>

        <div className="space-y-4 text-center">
          <div className="flex justify-center items-center gap-3">
            <Scale className="w-8 h-8 text-blue-600" />
            <h1 className="bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-transparent text-4xl">
              Legal Cases
            </h1>
          </div>
          {client && (
            <div className="flex sm:flex-row flex-col justify-center items-center gap-2 text-gray-600 text-lg">
              <div className="flex items-center gap-x-2">
                <User className="w-5 h-5 text-gray-400" />
                <span className="font-medium">{client.name}</span>
              </div>
              {client.contact_number && (
                <div className="flex items-center gap-x-2">
                  <Contact className="w-5 h-5 text-gray-400" />
                  <span className="font-medium">{client.contact_number}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-600">Total Cases</p>
                <p className="font-bold text-blue-800 text-3xl">
                  {stats.total}
                </p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
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
                <p className="font-medium text-purple-600">Closed Cases</p>
                <p className="font-bold text-purple-800 text-3xl">
                  {stats.closed}
                </p>
              </div>
              <Scale className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg border-yellow-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-yellow-600">Pending Fee</p>
                <p className="font-bold text-yellow-800 text-2xl">
                  Rs:{stats.pendingFee.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Table */}
      <Card className="bg-white/80 shadow-2xl backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-semibold text-gray-800 text-sm sm:text-2xl">
              Case Management
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => openModal()}
                  className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-indigo-600 hover:to-indigo-700 shadow-lg"
                >
                  <Plus size={16} className="mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-semibold text-gray-800 text-xl">
                    {editingCase ? "Edit Case" : "Add New Case"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="gap-6 space-y-0 grid grid-cols-2"
                  >
                    <FormField
                      control={form.control}
                      name="case_title"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="font-medium text-gray-700">
                            Case Title *
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter case title" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="computer_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Computer Code
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter computer code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="court_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Court Name
                          </FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter court name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="case_description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="font-medium text-gray-700">
                            Case Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter case description"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="previous_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Previous Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="next_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Next Date
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="case_proceeding"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Case Proceeding
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select proceeding" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {proceedingOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Status *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statusOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="total_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Total Fee (Rs:)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              placeholder="0"
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="received_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Received Fee (Rs:)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              placeholder="0"
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="case_decision"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel className="font-medium text-gray-700">
                            Case Decision
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select decision" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {decisionOptions.map((opt) => (
                                <SelectItem key={opt} value={opt}>
                                  {opt}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 col-span-2 pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-blue-600 hover:from-blue-700 to-indigo-600 hover:to-indigo-700"
                      >
                        {loading
                          ? "Processing..."
                          : editingCase
                          ? "Update Case"
                          : "Add Case"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="flex-1 bg-gray-500 hover:bg-gray-600"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
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
              searchPlaceholder="Search cases, proceedings, courts..."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
