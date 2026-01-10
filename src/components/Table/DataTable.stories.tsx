import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";

const meta = {
  title: "Components/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data types
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: "active" | "inactive";
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

// Mock data
const mockUsers: User[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i % 3 === 0 ? "admin" : i % 3 === 1 ? "user" : "guest",
  status: i % 4 === 0 ? "inactive" : "active",
  createdAt: new Date(2024, 0, i + 1).toISOString(),
}));

const mockProducts: Product[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  price: Math.floor(Math.random() * 1000) + 10,
  category: ["Electronics", "Clothing", "Food", "Books"][i % 4],
  stock: Math.floor(Math.random() * 100),
}));

// Column definitions
const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            role === "admin"
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
              : role === "user"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
          }`}
        >
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            status === "active"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"));
      return date.toLocaleDateString();
    },
  },
];

const productColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "name",
    header: "Product Name",
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number;
      return `$${price.toFixed(2)}`;
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <span
          className={stock < 10 ? "text-red-600 dark:text-red-400 font-semibold" : ""}
        >
          {stock}
        </span>
      );
    },
  },
];

export const Basic: Story = {
  args: {
    data: mockUsers.slice(0, 10),
    columns: userColumns as ColumnDef<unknown>[],
  } as any,
};

export const WithPagination: Story = {
  args: {
    data: mockUsers,
    columns: userColumns as ColumnDef<unknown>[],
    pagination: {
      enabled: true,
      pageSize: 10,
    },
  } as any,
};

export const WithoutPagination: Story = {
  args: {
    data: mockUsers.slice(0, 5),
    columns: userColumns as ColumnDef<unknown>[],
    pagination: {
      enabled: false,
    },
  } as any,
};

export const WithColumnSettings: Story = {
  args: {
    data: mockUsers,
    columns: userColumns as ColumnDef<unknown>[],
    pagination: {
      enabled: true,
      pageSize: 10,
    },
    columnSettings: {
      enabled: true,
      storageKey: "storybook_users_table_columns",
      defaultColumns: [
        { key: "id", label: "ID", visible: true },
        { key: "name", label: "Name", visible: true },
        { key: "email", label: "Email", visible: true },
        { key: "role", label: "Role", visible: true },
        { key: "status", label: "Status", visible: true },
        { key: "createdAt", label: "Created At", visible: false },
      ],
    },
  } as any,
};

export const WithoutSorting: Story = {
  args: {
    data: mockUsers.slice(0, 10),
    columns: userColumns as ColumnDef<unknown>[],
    sorting: {
      enabled: false,
    },
  } as any,
};

export const Loading: Story = {
  args: {
    data: [],
    columns: userColumns as ColumnDef<unknown>[],
    loading: true,
  } as any,
};

export const Error: Story = {
  args: {
    data: [],
    columns: userColumns as ColumnDef<unknown>[],
    error: "Failed to load data. Please try again later.",
  } as any,
};

export const Empty: Story = {
  args: {
    data: [],
    columns: userColumns as ColumnDef<unknown>[],
    emptyMessage: "No users found",
  } as any,
};

function RefreshButtonStory() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockUsers.slice(0, 10));

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setData(mockUsers.slice(0, 10));
      setLoading(false);
    }, 1000);
  };

  return (
    <DataTable
      data={data}
      columns={userColumns}
      refreshButton={{
        onClick: handleRefresh,
        loading,
      }}
    />
  );
}

export const WithRefreshButton: Story = {
  render: () => <RefreshButtonStory />,
} as any;

export const CustomCellRendering: Story = {
  args: {
    data: mockProducts,
    columns: productColumns as ColumnDef<unknown>[],
    pagination: {
      enabled: true,
      pageSize: 10,
    },
  } as any,
};

export const CustomRowStyling: Story = {
  args: {
    data: mockUsers.slice(0, 10),
    columns: userColumns as ColumnDef<unknown>[],
    getRowClassName: (row: User) =>
      row.status === "inactive"
        ? "bg-gray-50 dark:bg-gray-900/50 opacity-60"
        : "",
  } as any,
};

export const FullFeatured: Story = {
  args: {
    data: mockUsers,
    columns: userColumns as ColumnDef<unknown>[],
    pagination: {
      enabled: true,
      pageSize: 10,
    },
    columnSettings: {
      enabled: true,
      storageKey: "storybook_full_featured_table",
      defaultColumns: [
        { key: "id", label: "ID", visible: true },
        { key: "name", label: "Name", visible: true },
        { key: "email", label: "Email", visible: true },
        { key: "role", label: "Role", visible: true },
        { key: "status", label: "Status", visible: true },
        { key: "createdAt", label: "Created At", visible: true },
      ],
    },
    sorting: {
      enabled: true,
    },
    refreshButton: {
      onClick: () => {
        // Storybook example - refresh action
      },
      loading: false,
    },
  } as any,
};

export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i % 3 === 0 ? "admin" : "user",
      status: i % 4 === 0 ? "inactive" : "active",
      createdAt: new Date(2024, 0, i + 1).toISOString(),
    })),
    columns: userColumns as ColumnDef<unknown>[],
    pagination: {
      enabled: true,
      pageSize: 20,
    },
  } as any,
};
