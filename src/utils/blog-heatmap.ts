import type { CollectionEntry } from 'astro:content';
import { sortByDateDesc } from './content-dates';

export interface HeatmapWindow {
  totalPosts: number;
  activeDays: number;
  currentStreak: number;
  latestPosts: LatestPost[];
}

export interface LatestPost {
  title: string;
  href: string;
  date: Date;
}

type BlogPost = CollectionEntry<'blog'>;

export function getDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function getLatestPosts(posts: BlogPost[], count = 1): LatestPost[] {
  return sortByDateDesc(posts)
    .slice(0, Math.max(1, count))
    .map((post) => ({
      title: post.data.title,
      href: `/blog/${post.id}/`,
      date: post.data.date,
    }));
}

function getPostCounts(posts: BlogPost[]) {
  const counts = new Map<string, number>();

  for (const post of posts) {
    const key = getDateKey(post.data.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

export function createRecentBlogHeatmap(posts: BlogPost[], latestCount = 1): HeatmapWindow {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const postCounts = getPostCounts(posts);

  // 连续天数从今天按天倒数，遇到没有文章的日期即停；未来排期不参与。
  let currentStreak = 0;
  const cursor = new Date(today);
  while ((postCounts.get(getDateKey(cursor)) ?? 0) > 0) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // 活跃天数按建站以来全部文章的发布日期去重统计（只增不减），
  // 排除未来日期的草稿排期。
  const todayKey = getDateKey(today);
  const activeDayKeys = new Set<string>();

  for (const post of posts) {
    const key = getDateKey(post.data.date);

    if (key > todayKey) {
      continue;
    }

    activeDayKeys.add(key);
  }

  return {
    totalPosts: posts.length,
    activeDays: activeDayKeys.size,
    currentStreak,
    latestPosts: getLatestPosts(posts, latestCount),
  };
}
