import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/site/page-shell";
import { blogPosts } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Blog | MeteVet",
  description: "Read expert articles on preventive care, wellness, and the modern veterinary experience.",
};

export default function BlogPage() {
  return (
    <PageShell
      eyebrow="Blog"
      title="Insights for pet owners who care deeply about long-term health."
      description="Explore thoughtful articles on wellness, prevention, and what it means to provide exceptional veterinary care."
      ctaLabel="Book a consultation"
      ctaHref="/appointment"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article key={post.title} className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(145deg,_rgba(255,255,255,0.08),_rgba(255,255,255,0.03))] p-8 shadow-[0_15px_45px_rgba(0,0,0,0.16)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d8b36a]">{post.category}</p>
            <h2 className="mt-4 text-2xl font-semibold text-white">{post.title}</h2>
            <p className="mt-4 text-base leading-8 text-[#b8c5be]">{post.excerpt}</p>
            <div className="mt-6 flex items-center justify-between text-sm text-[#dce7e1]">
              <span>{post.date}</span>
              <Link href="/contact" className="font-semibold text-[#d8b36a]">Read more</Link>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
