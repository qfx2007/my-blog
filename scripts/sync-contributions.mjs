import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const days = 100;
const now = new Date();
const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
const start = new Date(end);
start.setUTCDate(start.getUTCDate() - (days - 1));
const key = (date) => date.toISOString().slice(0, 10);
const empty = () =>
  Object.fromEntries(
    Array.from({ length: days }, (_, i) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);
      return [key(date), 0];
    }),
  );

async function github() {
  const token = process.env.GITHUB_TOKEN;
  const login = process.env.GITHUB_CONTRIBUTION_USERNAME || 'qfx2007';
  if (!token || !login) throw new Error('GitHub contribution credentials are missing');
  const query = `query($login:String!,$from:DateTime!,$to:DateTime!){user(login:$login){contributionsCollection(from:$from,to:$to){contributionCalendar{weeks{contributionDays{date contributionCount}}}}}}`;
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      variables: {
        login,
        from: start.toISOString(),
        to: new Date(end.getTime() + 86400000 - 1).toISOString(),
      },
    }),
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status}`);
  const body = await response.json();
  if (body.errors || !body.data?.user) throw new Error('GitHub contribution calendar unavailable');
  const result = empty();
  for (const week of body.data.user.contributionsCollection.contributionCalendar.weeks)
    for (const day of week.contributionDays)
      if (day.date in result) result[day.date] = day.contributionCount;
  return result;
}

async function gitee() {
  const login = process.env.GITEE_CONTRIBUTION_USERNAME || 'qu-fangxiang';
  if (!login) throw new Error('Gitee contribution username is missing');
  const url = `https://gitee.com/${encodeURIComponent(login)}/contribution_timeline?start_date=${key(start)}&end_date=${key(end)}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Gitee contribution endpoint ${response.status}`);
  const body = await response.json();
  const entries = Array.isArray(body) ? body : body.data;
  const result = empty();
  if (!Array.isArray(entries) && body && typeof body === 'object') {
    for (const [date, count] of Object.entries(body))
      if (date in result && Number.isFinite(Number(count))) result[date] = Number(count);
    if (Object.values(result).some((count) => count > 0)) return result;
  }
  if (!Array.isArray(entries)) throw new Error('Gitee native contribution data unavailable');
  for (const item of entries) {
    const rawDate = item.date || item.day || item.contribution_date || item.created_at;
    if (!rawDate) continue;
    const date = String(rawDate);
    const localDate = item.created_at
      ? new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Shanghai',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(rawDate))
      : date.slice(0, 10);
    if (!(localDate in result)) continue;
    const count = item.count ?? item.contribution_count ?? item.contributions ?? item.commits;
    result[localDate] += Number.isFinite(Number(count)) ? Number(count) : 1;
  }
  return result;
}

const output = 'public/contributions.json';
try {
  const [gh, gt] = await Promise.all([github(), gitee()]);
  const contributions = Object.fromEntries(
    Object.keys(gh).map((date) => [date, gh[date] + gt[date]]),
  );
  const payload = {
    updatedAt: new Date().toISOString(),
    period: { start: key(start), end: key(end), days },
    sources: {
      github: Object.values(gh).reduce((sum, count) => sum + count, 0),
      gitee: Object.values(gt).reduce((sum, count) => sum + count, 0),
    },
    contributions,
  };
  await mkdir('public', { recursive: true });
  const previous = existsSync(output) ? await readFile(output, 'utf8') : '';
  if (previous !== JSON.stringify(payload, null, 2) + '\n')
    await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
} catch (error) {
  if (!existsSync(output)) throw error;
  console.warn(`Contribution sync failed; keeping ${output}:`, error.message);
}
