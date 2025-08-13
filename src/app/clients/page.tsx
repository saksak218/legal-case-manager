"use client";

import { useEffect, useState } from "react";
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
  Pencil,
  Trash,
  Plus,
  Users,
  UserPlus,
  Building,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@radix-ui/react-tooltip";

interface Client {
  id: string;
  name: string;
  contact_number: string;
  address: string;
  case_count?: number;
  cases?: object;
}

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_number: z.string().optional(),
  address: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    withCases: 0,
    totalCases: 0,
  });

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", contact_number: "", address: "" },
  });

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <div className="flex items-center space-x-3">
          <div className="flex justify-center items-center bg-blue-100 rounded-full w-8 h-8">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{row.getValue("name")}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "contact_number",
      header: "Contact",
      cell: ({ row }) => (
        <span className="text-gray-600">
          {row.getValue("contact_number") || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <Building className="w-4 h-4 text-gray-400" />
          <span className="max-w-xs text-gray-600 truncate">
            {row.getValue("address") || "N/A"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "case_count",
      header: "Cases",
      cell: ({ row }) => (
        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
          {/* {row.original.cases[0].count ?? 0} */}
          {row.original.case_count || 0} cases
        </Badge>
      ),
    },
    {
      accessorKey: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="lg"
            onClick={() => openModal(row.original)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Pencil size={14} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => handleDelete(row.original.id)}
            className="bg-red-500 hover:bg-red-600"
          >
            <Trash size={14} />
          </Button>

          <Tooltip>
            <TooltipTrigger>
              <Link
                href={`/clients/${row.original.id}/cases`}
                className="inline-flex bg-green-500 hover:bg-green-600 px-3.5 py-3 rounded-sm text-white"
              >
                <Eye size={14} />
              </Link>
            </TooltipTrigger>
            <TooltipContent>
              <p className="bg-gray-600 px-2 py-1 rounded-full text-white text-xs">
                View Cases
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      ),
    },
  ];

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      // Get clients with case count
      const { data: clientsData, error: clientsError } = await supabase.from(
        "clients"
      ).select(`
          *,
          cases(count)
        `);

      if (clientsError) throw clientsError;

      const clientsWithCounts = (clientsData || []).map((client) => ({
        ...client,
        case_count: client.cases[0].count || 0,
      }));

      setClients(clientsWithCounts);

      // Calculate stats
      const total = clientsWithCounts.length;
      const withCases = clientsWithCounts.filter(
        (c) => c.case_count > 0
      ).length;
      const totalCases = clientsWithCounts.reduce(
        (sum, c) => sum + c.case_count,
        0
      );
      //   console.log(withCases);

      setStats({ total, withCases, totalCases });
    } catch (error) {
      toast.error("Failed to load clients");
    }
    setLoading(false);
  }

  async function handleSubmit(values: ClientForm) {
    setLoading(true);
    try {
      if (editingClient) {
        const { error } = await supabase
          .from("clients")
          .update(values)
          .eq("id", editingClient.id);
        if (error) throw error;
        toast.success("Client updated successfully");
      } else {
        const { error } = await supabase.from("clients").insert(values);
        if (error) throw error;
        toast.success("Client added successfully");
      }
      setOpen(false);
      loadClients();
      form.reset();
    } catch (error) {
      toast.error("Operation failed");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (
      confirm(
        "Are you sure you want to delete this client and all their cases?"
      )
    ) {
      setLoading(true);
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete client");
      } else {
        toast.success("Client deleted successfully");
        loadClients();
      }
      setLoading(false);
    }
  }

  function openModal(client?: Client) {
    if (client) {
      setEditingClient(client);
      form.reset({
        name: client.name,
        contact_number: client.contact_number || "",
        address: client.address || "",
      });
    } else {
      setEditingClient(null);
      form.reset({ name: "", contact_number: "", address: "" });
    }
    setOpen(true);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4 text-center">
        <div className="flex justify-center items-center gap-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h1 className="bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-transparent text-4xl">
            Client Management
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Manage your clients and their legal matters
        </p>
      </div>

      {/* Stats Cards */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg border-blue-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-blue-600">Total Clients</p>
                <p className="font-bold text-blue-800 text-3xl">
                  {stats.total}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 shadow-lg border-green-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-green-600">Active Clients</p>
                <p className="font-bold text-green-800 text-3xl">
                  {stats.withCases}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg border-purple-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-purple-600">Total Cases</p>
                <p className="font-bold text-purple-800 text-3xl">
                  {stats.totalCases}
                </p>
              </div>
              <Building className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card className="bg-white/80 shadow-2xl backdrop-blur-sm border-white/20">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="font-semibold text-gray-800 text-lg sm:text-2xl">
              All Clients
            </CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="lg"
                  onClick={() => openModal()}
                  className="bg-gradient-to-r from-blue-600 hover:from-blue-700 to-indigo-600 hover:to-indigo-700 shadow-lg"
                >
                  <Plus size={16} className="mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-semibold text-gray-800 text-xl">
                    {editingClient ? "Edit Client" : "Add New Client"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Client Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter client name"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contact_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Contact Number
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter contact number"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-medium text-gray-700">
                            Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter address"
                              className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-blue-600 hover:from-blue-700 to-indigo-600 hover:to-indigo-700"
                      >
                        {loading
                          ? "Processing..."
                          : editingClient
                          ? "Update Client"
                          : "Add Client"}
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
              <span className="ml-3 text-gray-600">Loading clients...</span>
            </div>
          ) : (
            <EnhancedDataTable
              columns={columns}
              data={clients}
              searchKey="name"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
