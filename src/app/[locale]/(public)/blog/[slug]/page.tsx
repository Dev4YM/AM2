import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import posts from "@/data/blog-posts.json";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = (posts as { slug: string; title: string; content: string; date: string }[]).find(
    (p) => p.slug === slug,
  );
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 prose prose-slate">
      <p className="text-sm text-slate-500">{post.date}</p>
      <h1 className="text-4xl font-bold">{post.title}</h1>
      <p className="mt-8 whitespace-pre-wrap text-slate-700">{post.content}</p>
    </article>
  );
}
