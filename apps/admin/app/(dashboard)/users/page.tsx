import { auth, type User } from "@clerk/nextjs/server";
import { columns } from "./columns";
import { DataTable } from "./data-table";

const getData = async (): Promise<{ data: User[]; totalCount: number }> => {
  const { getToken } = await auth();
  const token = await getToken();
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_AUTH_SERVICE_URL}/users`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      console.log(
        `Auth service returned ${res.status} fetching /users:`,
        await res.text().catch(() => ""),
      );
      return { data: [], totalCount: 0 };
    }

    const json = await res.json();

    if (!Array.isArray(json?.data)) {
      console.log(
        "Auth service /users response is missing a data array:",
        json,
      );
      return { data: [], totalCount: 0 };
    }

    return { data: json.data, totalCount: json.totalCount ?? json.data.length };
  } catch (err) {
    console.log(err);
    return { data: [], totalCount: 0 };
  }
};

const UsersPage = async () => {
  const res = await getData();
  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Users</h1>
      </div>
      <DataTable columns={columns} data={res.data} />
    </div>
  );
};

export default UsersPage;
