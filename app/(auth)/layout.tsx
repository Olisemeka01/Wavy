import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-page px-4">
      <Link
        href="/"
        className="mb-6 text-xl font-semibold tracking-tight text-text"
      >
        Wavy
      </Link>
      <main className="w-full max-w-[320px]">{children}</main>
    </div>
  );
}
