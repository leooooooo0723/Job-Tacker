export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
      {children}
    </div>
  );
}
