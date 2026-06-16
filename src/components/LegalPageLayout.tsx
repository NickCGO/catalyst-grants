import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import brandLogo from "@/assets/find-the-grant-logo.png.asset.json";

export default function LegalPageLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="h-[72px] flex items-center justify-between px-6 lg:px-12 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <img src={brandLogo.url} alt="Find The Grant" className="h-8 w-8 rounded-md object-cover" />
          <span className="text-lg font-bold text-foreground tracking-tight">Find The Grant</span>
        </Link>
        <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to homepage
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {updated}</p>
        <article className="prose prose-sm sm:prose-base max-w-none text-foreground prose-headings:font-semibold prose-headings:text-foreground prose-a:text-primary">
          {children}
        </article>
      </div>
    </div>
  );
}
