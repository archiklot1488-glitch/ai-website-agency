import Link from "next/link";
import type { BusinessWithWebsite } from "@/lib/businesses";
import { GenerateWebsiteButton } from "@/components/generate-website-button";
import { StatusBadge } from "@/components/status-badge";

type BusinessListProps = {
  businesses: BusinessWithWebsite[];
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

function formatStatus(value: string | null | undefined) {
  return (value || "not_sent").replaceAll("_", " ");
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
              <th className="px-4 py-3" scope="col">
                Website
              </th>
              <th className="px-4 py-3" scope="col">
                Action
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
                <td className="px-4 py-4 align-top">
                  {business.website ? (
                    <div className="space-y-2 text-xs leading-5 text-stone-700">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-950">
                          Website
                        </span>
                        <StatusBadge status={business.website.status} />
                      </div>
                      <div>
                        <span className="font-semibold text-stone-600">
                          Slug:
                        </span>{" "}
                        <code className="rounded bg-stone-100 px-1.5 py-1 text-stone-800">
                          {business.website.slug}
                        </code>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-600">
                          Preview:
                        </span>{" "}
                        <Link
                          className="break-all rounded bg-stone-100 px-1.5 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/preview/${business.website.slug}?token=${business.website.preview_token}`}
                        >
                          /preview/{business.website.slug}?token=
                          {business.website.preview_token}
                        </Link>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-600">
                          Editor:
                        </span>{" "}
                        <Link
                          className="rounded bg-stone-100 px-1.5 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/admin/websites/${business.website.id}/edit`}
                        >
                          Edit Website
                        </Link>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-600">
                          Offer:
                        </span>{" "}
                        <Link
                          className="rounded bg-stone-100 px-1.5 py-1 text-stone-800 underline-offset-4 hover:underline"
                          href={`/admin/websites/${business.website.id}/offer`}
                        >
                          Offer / Send Preview
                        </Link>
                      </div>
                      <div>
                        <span className="font-semibold text-stone-600">
                          Outreach:
                        </span>{" "}
                        <code className="rounded bg-stone-100 px-1.5 py-1 text-stone-800">
                          {formatStatus(business.website.outreach_status)}
                        </code>
                      </div>
                      {business.website.preview_sent_at ? (
                        <div>
                          <span className="font-semibold text-stone-600">
                            Sent:
                          </span>{" "}
                          {formatDate(business.website.preview_sent_at)}
                        </div>
                      ) : null}
                      {business.website.status === "live" ? (
                        <div>
                          <span className="font-semibold text-stone-600">
                            Live:
                          </span>{" "}
                          <Link
                            className="break-all rounded bg-stone-100 px-1.5 py-1 text-stone-800 underline-offset-4 hover:underline"
                            href={`/site/${business.website.slug}`}
                          >
                            /site/{business.website.slug}
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-sm text-stone-500">
                      No website generated
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <GenerateWebsiteButton
                    businessId={business.id}
                    disabled={Boolean(business.website)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
