"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, CheckCircle, XCircle, Eye, AlertTriangle, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { DataTable } from "@/components/books/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define the Book type
export type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: "Approved" | "Rejected" | "Pending Review" | "Flagged";
  submittedBy: string;
  submittedDate: string;
  flagReason?: string;
  rejectionReason?: string;
};

// Mock data for books
const mockBooks: Book[] = [
  {
    id: "1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    status: "Approved",
    submittedBy: "user123",
    submittedDate: "2023-05-10",
  },
  {
    id: "2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Fiction",
    status: "Pending Review",
    submittedBy: "user456",
    submittedDate: "2023-05-12",
  },
  {
    id: "3",
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    status: "Flagged",
    submittedBy: "user789",
    submittedDate: "2023-05-15",
    flagReason: "Potential copyright issues",
  },
  {
    id: "4",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    status: "Pending Review",
    submittedBy: "user321",
    submittedDate: "2023-05-18",
  },
  {
    id: "5",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    status: "Rejected",
    submittedBy: "user654",
    submittedDate: "2023-05-20",
    rejectionReason: "Content violates community guidelines",
  },
];

// Status badge component
const getStatusBadge = (status: string) => {
  switch (status) {
    case "Approved":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
          <CheckCircle className="h-3 w-3" />
          {status}
        </span>
      );
    case "Rejected":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          <XCircle className="h-3 w-3" />
          {status}
        </span>
      );
    case "Flagged":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
          <AlertTriangle className="h-3 w-3" />
          {status}
        </span>
      );
    case "Pending Review":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
          <Eye className="h-3 w-3" />
          {status}
        </span>
      );
    default:
      return <span>{status}</span>;
  }
};

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>(mockBooks);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Count books by status
  const pendingCount = books.filter(book => book.status === "Pending Review").length;
  const flaggedCount = books.filter(book => book.status === "Flagged").length;
  
  // Bulk actions
  const handleBulkApprove = () => {
    setBooks(
      books.map(book => 
        selectedBookIds.includes(book.id) && book.status === "Pending Review"
          ? { ...book, status: "Approved" }
          : book
      )
    );
    setSelectedBookIds([]);
  };
  
  const handleBulkReject = () => {
    setBooks(
      books.map(book => 
        selectedBookIds.includes(book.id) && book.status === "Pending Review"
          ? { ...book, status: "Rejected" }
          : book
      )
    );
    setSelectedBookIds([]);
  };

  // Individual actions
  const handleApproveBook = (bookId: string) => {
    setBooks(
      books.map(book => 
        book.id === bookId
          ? { ...book, status: "Approved" }
          : book
      )
    );
  };
  
  const handleRejectBook = (bookId: string) => {
    setBooks(
      books.map(book => 
        book.id === bookId
          ? { ...book, status: "Rejected" }
          : book
      )
    );
  };

  // Create columns definition
  const columns: ColumnDef<Book>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "author",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Author
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("author")}</div>,
    },
    {
      accessorKey: "genre",
      header: "Genre",
      cell: ({ row }) => <div>{row.getValue("genre")}</div>,
    },
    {
      accessorKey: "submittedBy",
      header: "Submitted By",
      cell: ({ row }) => <div>{row.getValue("submittedBy")}</div>,
    },
    {
      accessorKey: "submittedDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("submittedDate")}</div>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const book = row.original;
        return (
          <div className="flex justify-end space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 cursor-pointer"
              onClick={() => window.alert(`Review details for: ${book.title}`)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">View details</span>
            </Button>
            
            {book.status === "Pending Review" && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 cursor-pointer"
                  onClick={() => handleApproveBook(book.id)}
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span className="sr-only">Approve</span>
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                  onClick={() => handleRejectBook(book.id)}
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Reject</span>
                </Button>
              </>
            )}
            
            {book.status === "Flagged" && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 cursor-pointer"
                onClick={() => window.alert(`Flag reason: ${book.flagReason || 'No reason provided'}`)}
                title="View Flag Reason"
              >
                <AlertTriangle className="h-4 w-4" />
                <span className="sr-only">View flag reason</span>
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Content Moderation</h1>
          <p className="text-muted-foreground mt-1">Review and approve books submitted by users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-md">
            <Eye className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{pendingCount} Pending</span>
          </div>
          <div className="flex items-center px-3 py-1 bg-yellow-50 text-yellow-700 rounded-md">
            <AlertTriangle className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{flaggedCount} Flagged</span>
          </div>
        </div>
      </div>

      {selectedBookIds.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <div className="text-sm font-medium">
            {selectedBookIds.length} {selectedBookIds.length === 1 ? 'book' : 'books'} selected
          </div>
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-green-600 cursor-pointer"
              onClick={handleBulkApprove}
            >
              Approve Selected
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 cursor-pointer"
              onClick={handleBulkReject}
            >
              Reject Selected
            </Button>
          </div>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={books} 
        onRowSelectionChange={setSelectedBookIds}
        pageSize={5}
      />
    </div>
  );
} 