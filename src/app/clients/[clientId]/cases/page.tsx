"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Trash, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
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
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

const columns: ColumnDef<Case>[] = [
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
      </div>
    ),
  },
];

export default function ClientCasesPage() {
  const { clientId } = useParams();
  const [cases, setCases] = useState<Case[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    loadCases();
  }, [clientId]);

  async function loadCases() {
    setLoading(true);
    const { data, error } = await supabase
      .from("cases")
      .select("*")
      .eq("client_id", clientId);
    if (error) {
      toast.error("Failed to load cases");
    } else {
      setCases(data || []);
    }
    setLoading(false);
  }

  async function handleSubmit(values: CaseForm) {
    setLoading(true);
    try {
      let updateData = { ...values, client_id: clientId };

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
        toast.success("Case updated");
      } else {
        const { error } = await supabase.from("cases").insert(updateData);
        if (error) throw error;
        toast.success("Case added");
      }
      setOpen(false);
      loadCases();
    } catch (error) {
      toast.error("Operation failed");
    }
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (confirm("Delete this case?")) {
      setLoading(true);
      const { error } = await supabase.from("cases").delete().eq("id", id);
      if (error) {
        toast.error("Failed to delete");
      } else {
        toast.success("Case deleted");
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
        previous_date: c.previous_date
          ? format(parseISO(c.previous_date), "yyyy-MM-dd")
          : "",
        next_date: c.next_date
          ? format(parseISO(c.next_date), "yyyy-MM-dd")
          : "",
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

  const tableData = cases.map((c) => ({
    ...c,
    handleEdit: openModal,
    handleDelete,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Cases for Client
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openModal()}>
                <Plus size={16} className="mr-2" /> Add Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCase ? "Edit Case" : "Add Case"}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="gap-4 grid grid-cols-2"
                >
                  <FormField
                    control={form.control}
                    name="case_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Computer Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
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
                        <FormLabel>Previous Date</FormLabel>
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
                        <FormLabel>Next Date</FormLabel>
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
                        <FormLabel>Proceeding</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
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
                    name="court_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Court Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_fee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
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
                        <FormLabel>Received Fee</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
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
                      <FormItem>
                        <FormLabel>Decision</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
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
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="col-span-2"
                  >
                    {editingCase ? "Update" : "Add"}
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
