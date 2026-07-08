type WebsiteErrorPageProps = {
  message: string;
  title?: string;
};

export function WebsiteErrorPage({
  message,
  title = "Website unavailable",
}: WebsiteErrorPageProps) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-red-700">
        Rendering error
      </p>
      <h1 className="mt-4 text-3xl font-semibold text-stone-950">{title}</h1>
      <p className="mt-4 leading-7 text-stone-700">{message}</p>
    </main>
  );
}
