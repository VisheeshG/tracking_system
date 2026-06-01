import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a free Linkto account and start tracking creator campaigns with branded links.",
  robots: { index: true, follow: true },
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
