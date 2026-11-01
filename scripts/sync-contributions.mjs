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
  if (body.errors || !body.data?.user) {
    const detail = body.errors?.map((error) => error.message).join('; ') || 'user not found';
    throw new Error(`GitHub contribution calendar unavailable: ${detail}`);
  }
  const result = empty();
  for (const week of body.data.user.contributionsCollection.contributionCalendar.weeks)
    for (const day of week.contributionDays)
      if (day.date in result) result[day.date] = day.contributionCount;
  return result;
}

async function gitee() {
  const login = process.env.GITEE_CONTRIBUTION_USERNAME || 'qu-fangxiang';
  const token = process.env.GITEE_TOKEN;
  if (!token) throw new Error('GITEE_TOKEN is missing');
  const headers = { Accept: 'application/json', Authorization: `Bearer ${token}` };
  const api = 'https://gitee.com/api/v5';
  const request = async (path, params = {}) => {
    const query = new URLSearchParams({ ...params, access_token: token });
    const response = await fetch(`${api}${path}?${query}`, { headers });
    if (!response.ok) throw new Error(`Gitee API ${response.status} for ${path}`);
    return response.json();
  };
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const batch = await request('/user/repos', { page, per_page: 100, type: 'all' });
    if (!Array.isArray(batch)) throw new Error('Gitee repositories response is invalid');
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  const result = empty();
  for (const repository of repositories) {
    const owner = repository.owner?.login || login;
    const name = repository.path || repository.name;
    if (!name) continue;
    const commits = await request(
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits`,
      {
        since: start.toISOString(),
        until: new Date(end.getTime() + 86400000 - 1).toISOString(),
        author: login,
        per_page: 100,
      },
    );
    if (!Array.isArray(commits))
      throw new Error(`Gitee commits response is invalid for ${owner}/${name}`);
    for (const commit of commits) {
      const rawDate = commit.commit?.author?.date || commit.created_at;
      if (!rawDate) continue;
      const localDate = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(rawDate));
      if (localDate in result) result[localDate] += 1;
    }
  }
  return result;
}

const output = 'public/contributions.json';
try {
  const gh = await github();
  const gt = await gitee();
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
