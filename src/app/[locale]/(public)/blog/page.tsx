import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import posts from "@/data/blog-posts.json";

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const prefix = locale === "en" ? "" : `/${locale}`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold">Blog</h1>
      <p className="mt-2 text-slate-600">Sales, prospecting, CRM, and AI automation guides.</p>
      <ul className="mt-12 space-y-8">
        {(posts as { slug: string; title: string; excerpt: string; category: string; date: string }[]).map(
          (post) => (
            <li key={post.slug} className="border-b border-slate-100 pb-8">
              <p className="text-sm text-emerald-600">{post.category} · {post.date}</p>
              <Link href={`${prefix}/blog/${post.slug}`} className="mt-2 block text-xl font-semibold hover:text-emerald-700">
                {post.title}
              </Link>
              <p className="mt-2 text-slate-600">{post.excerpt}</p>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
