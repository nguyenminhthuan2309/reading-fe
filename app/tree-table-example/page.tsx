"use client";

import { TreeTable } from "@/components/ui/tree-table";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

// Define the data types
interface Department {
  id: string;
  name: string;
  employees: number;
  budget: number;
  children?: Team[];
}

interface Team extends Department {
  lead: string;
  members: number;
  status: "active" | "inactive";
}

// Sample data
const data: Department[] = [
  {
    id: "1",
    name: "Engineering",
    employees: 150,
    budget: 5000000,
    children: [
      {
        id: "1-1",
        name: "Frontend Team",
        employees: 20,
        budget: 1500000,
        lead: "John Doe",
        members: 20,
        status: "active",
      },
      {
        id: "1-2",
        name: "Backend Team",
        employees: 25,
        budget: 2500000,
        lead: "Jane Smith",
        members: 25,
        status: "active",
      },
    ],
  },
  {
    id: "2",
    name: "Marketing",
    employees: 80,
    budget: 3000000,
    children: [
      {
        id: "2-1",
        name: "Digital Marketing",
        employees: 15,
        budget: 1500000,
        lead: "Mike Johnson",
        members: 15,
        status: "active",
      },
      {
        id: "2-2",
        name: "Content Creation",
        employees: 12,
        budget: 1200000,
        lead: "Sarah Wilson",
        members: 12,
        status: "inactive",
      },
    ],
  },
];

// Define parent columns
const parentColumns: ColumnDef<Department>[] = [
  {
    accessorKey: "name",
    header: "Department",
  },
  {
    accessorKey: "employees",
    header: "Employees",
    cell: ({ row }) => {
      const employees = row.getValue("employees") as number;
      return (
        <Badge variant="secondary" className="font-mono">
          {employees.toLocaleString()}
        </Badge>
      );
    },
  },
  {
    accessorKey: "budget",
    header: "Budget",
    cell: ({ row }) => {
      const budget = row.getValue("budget") as number;
      return (
        <span className="font-mono">
          ${budget.toLocaleString()}
        </span>
      );
    },
  },
];

// Define child columns
const childColumns: ColumnDef<Team>[] = [
  {
    accessorKey: "name",
    header: "Team Name",
  },
  {
    accessorKey: "lead",
    header: "Team Lead",
  },
  {
    accessorKey: "members",
    header: "Members",
    cell: ({ row }) => {
      const members = row.getValue("members") as number;
      return (
        <Badge variant="secondary" className="font-mono">
          {members}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant={status === "active" ? "default" : "destructive"}
          className="capitalize"
        >
          {status}
        </Badge>
      );
    },
  },
];

export default function TreeTableExample() {
  const [selectedItems, setSelectedItems] = useState<(Department | Team)[]>([]);

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Department Structure</h1>
        {selectedItems.length > 0 && (
          <Badge variant="outline" className="text-sm">
            {selectedItems.length} items selected
          </Badge>
        )}
      </div>
      <TreeTable
        columns={parentColumns}
        childColumns={childColumns}
        data={data}
        getSubRows={(row) => row.children}
        searchable
        pagination
        pageSize={10}
        onSelectionChange={setSelectedItems}
      />
    </div>
  );
} 