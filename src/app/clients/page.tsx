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
import { Label } from "@/components/ui/label";
import { Pencil, Trash, Plus } from "lucide-react";
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
import { DataTable } from "@/components/data-table"; // Assuming Shadcn DataTable component
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Client {
  id: string;
  name: string;
  contact_number: string;
  address: string;
}

const clientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_number: z.string().optional(),
  address: z.string().optional(),
});

type ClientForm = z.infer<typeof clientSchema>;

const columns: ColumnDef<Client>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
  },
  {
    accessorKey: "address",
    header: "Address",
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => row.original.handleEdit(row.original)}
        >
          <Pencil size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => row.original.handleDelete(row.original.id)}
        >
          <Trash size={16} />
        </Button>
        <Link
          href={`/clients/${row.original.id}/cases`}
          className="text-blue-500 hover:underline"
        >
          View Cases
        </Link>
      </div>
    ),
  },
];

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<ClientForm>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: "", contact_number: "", address: "" },
  });

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    const { data, error } = await supabase.from("clients").select("*");
    if (error) {
      toast.error("Failed to load clients");
    } else {
      setClients(data || []);
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
        toast.success("Client updated");
      } else {
        const { error } = await supabase.from("clients").insert(values);
        if (error) throw error;
        toast.success("Client added");
      }
      setOpen(false);
      loadClients();
    } catch (error) {
      toast.error("Operation failed");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this client and all their cases?")) {
      setLoading(true);
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete");
      } else {
        toast.success("Client deleted");
        loadClients();
      }
      setLoading(false);
    }
  }

  function openModal(client?: Client) {
    if (client) {
      setEditingClient(client);
      form.reset(client);
    } else {
      setEditingClient(null);
      form.reset({ name: "", contact_number: "", address: "" });
    }
    setOpen(true);
  }

  const tableData = clients.map((client) => ({
    ...client,
    handleEdit: openModal,
    handleDelete,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Clients
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openModal()}>
                <Plus size={16} className="mr-2" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingClient ? "Edit Client" : "Add Client"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={loading} className="w-full">
                    {editingClient ? "Update" : "Add"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable columns={columns} data={tableData} />
        )}
      </CardContent>
    </Card>
  );
}
