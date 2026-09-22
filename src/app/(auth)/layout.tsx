import { AuthFlowLayout } from "@/modules/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthFlowLayout>{children}</AuthFlowLayout>;
}
