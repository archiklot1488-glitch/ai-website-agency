import type { Business } from "@/types/database";
import { StatusBadge } from "@/components/status-badge";

type BusinessListProps = {
  businesses: Business[];
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  return dateFormatter.format(new Date(value));
}

export function BusinessList({ businesses }: BusinessListProps) {
  if (businesses.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-stone-300 bg-white px-5 py-10 text-center">
        <h3 className="text-base font-semibold text-stone-950">
          No businesses yet
        </h3>
        <p className="mt-2 text-sm text-stone-600">
          Create the first business record to start the Phase 1 workflow.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-sm">
          <thead className="bg-stone-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-stone-600">
            <tr>
              <th className="px-4 py-3" scope="col">
                Business
              </th>
              <th className="px-4 py-3" scope="col">
                Location
              </th>
              <th className="px-4 py-3" scope="col">
                Status
              </th>
              <th className="px-4 py-3" scope="col">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {businesses.map((business) => (
              <tr key={business.id}>
                <td className="px-4 py-4 align-top">
                  <div className="font-semibold text-stone-950">
                    {business.business_name}
                  </div>
                  <div className="mt-1 text-stone-600">
                    {business.business_type || "No type set"}
                  </div>
                </td>
                <td className="px-4 py-4 align-top text-stone-700">
                  {[business.city, business.country].filter(Boolean).join(", ") ||
                    "Not set"}
                </td>
                <td className="px-4 py-4 align-top">
                  <StatusBadge status={business.status} />
                </td>
                <td className="px-4 py-4 align-top text-stone-700">
                  {formatDate(business.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
