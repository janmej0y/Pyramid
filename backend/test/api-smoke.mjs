/**
 * End-to-end smoke test against a running API.
 *
 *   npm run start:prod          # in one terminal
 *   node test/api-smoke.mjs     # in another
 *
 * Uses fetch so non-2xx responses are values, not exceptions — every status
 * code is asserted explicitly.
 */

const BASE = process.env.API_URL ?? 'http://localhost:4000/api';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  \x1b[32mPASS\x1b[0m  ${name}`);
    passed++;
  } else {
    console.log(`  \x1b[31mFAIL\x1b[0m  ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

async function req(method, path, { body, token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  return { status: res.status, data };
}

function section(title) {
  console.log(`\n\x1b[36m=== ${title} ===\x1b[0m`);
}

async function main() {
  section('health');
  let r = await req('GET', '/health');
  check('health returns 200', r.status === 200, r.status);
  check('health reports database reachable', r.data?.status === 'ok', JSON.stringify(r.data));

  section('auth');
  r = await req('GET', '/tasks');
  check('protected route rejects anonymous (401)', r.status === 401, r.status);

  r = await req('GET', '/tasks', { token: 'garbage-token' });
  check('malformed token rejected (401)', r.status === 401, r.status);

  r = await req('POST', '/auth/guest', { body: { name: 'Dexter' } });
  check('guest login returns 201', r.status === 201, r.status);
  const token = r.data?.accessToken;
  check('guest login issues a token', typeof token === 'string' && token.length > 20);
  check('guest is flagged isGuest', r.data?.user?.isGuest === true);

  r = await req('GET', '/auth/me', { token });
  check('me resolves the session (200)', r.status === 200, r.status);
  check('me returns the same user name', r.data?.name === 'Dexter', r.data?.name);

  section('validation');
  r = await req('POST', '/auth/guest', { body: { name: 'x'.repeat(100) } });
  check('over-long name rejected (400)', r.status === 400, r.status);

  r = await req('POST', '/tasks', { token, body: { title: 'ok', priority: 'bogus' } });
  check('invalid priority rejected (400)', r.status === 400, r.status);

  r = await req('POST', '/tasks', { token, body: { title: '' } });
  check('empty title rejected (400)', r.status === 400, r.status);

  r = await req('POST', '/tasks', { token, body: { title: 'ok', surpriseField: 'x' } });
  check('unknown field rejected (400, whitelist)', r.status === 400, r.status);

  r = await req('POST', '/tasks', { token, body: { title: 'ok', status: 'Nonsense' } });
  check('invalid status rejected (400)', r.status === 400, r.status);

  r = await req('POST', '/tasks', { token, body: { title: 'ok', dueDate: 'not-a-date' } });
  check('invalid date rejected (400)', r.status === 400, r.status);

  r = await req('GET', '/tasks?take=9999', { token });
  check('take above max rejected (400)', r.status === 400, r.status);
  check(
    'errors use the standard envelope',
    Boolean(r.data?.statusCode && r.data?.message && r.data?.path && r.data?.timestamp),
    JSON.stringify(r.data),
  );

  section('tasks');
  r = await req('GET', '/tasks', { token });
  check('list returns seeded tasks', r.data?.total > 0, r.data?.total);
  check(
    'list excludes subtasks by default',
    (r.data?.items ?? []).every((t) => t.parentId === null),
  );
  check(
    'tasks expose flattened members and labels',
    Array.isArray(r.data?.items?.[0]?.members) && Array.isArray(r.data?.items?.[0]?.labels),
  );

  r = await req('GET', '/tasks/grouped', { token });
  check('grouped returns status buckets', Array.isArray(r.data) && r.data.length >= 3, r.data?.length);

  r = await req('GET', '/tasks?search=Write%20API', { token });
  check('search filters by title', r.data?.items?.[0]?.title?.includes('Write API'), r.data?.items?.[0]?.title);

  r = await req('GET', '/tasks?priority=urgent', { token });
  check(
    'priority filter returns only that priority',
    (r.data?.items ?? []).every((t) => t.priority === 'urgent'),
  );

  r = await req('GET', '/tasks?includeSubtasks=true', { token });
  const withSubs = r.data?.total ?? 0;
  check('includeSubtasks widens the result set', withSubs > 0);

  section('task crud');
  r = await req('POST', '/tasks', {
    token,
    body: { title: 'Smoke task', priority: 'high', status: 'To Do', labels: ['Smoke'] },
  });
  check('create returns 201', r.status === 201, r.status);
  const task = r.data;
  check('create persists labels', task?.labels?.includes('Smoke'), JSON.stringify(task?.labels));
  check('create defaults position', typeof task?.position === 'number');

  r = await req('PATCH', `/tasks/${task.id}`, {
    token,
    body: { priority: 'low', title: 'Smoke task renamed' },
  });
  check(
    'update applies changes',
    r.data?.priority === 'low' && r.data?.title === 'Smoke task renamed',
    `${r.data?.priority}/${r.data?.title}`,
  );

  r = await req('POST', '/tasks', { token, body: { title: 'Sub', parentId: task.id } });
  check('subtask creation succeeds', r.status === 201, r.status);
  const subtask = r.data;

  r = await req('POST', '/tasks', { token, body: { title: 'Nested', parentId: subtask.id } });
  check('nesting beyond one level rejected (400)', r.status === 400, r.status);

  r = await req('POST', '/tasks', { token, body: { title: 'x', projectId: 'nope' } });
  check('unknown projectId rejected (404)', r.status === 404, r.status);

  r = await req('POST', '/tasks', { token, body: { title: 'x', assigneeIds: ['nope'] } });
  check('unknown assignee rejected (400)', r.status === 400, r.status);

  section('comments');
  r = await req('POST', `/tasks/${task.id}/comments`, { token, body: { body: 'a comment' } });
  check('comment create returns 201', r.status === 201, r.status);
  const comment = r.data;

  r = await req('GET', `/tasks/${task.id}/comments`, { token });
  check('comments listed for task', Array.isArray(r.data) && r.data.length >= 1, r.data?.length);

  r = await req('POST', `/tasks/${task.id}/comments`, {
    token,
    body: { body: 'a reply', parentId: comment.id },
  });
  check('threaded reply accepted', r.status === 201, r.status);

  // Ownership: a second guest must not be able to edit the first guest's comment.
  const other = await req('POST', '/auth/guest', { body: { name: 'Other' } });
  r = await req('PATCH', `/comments/${comment.id}`, {
    token: other.data.accessToken,
    body: { body: 'hijacked' },
  });
  check('another user cannot edit my comment (403)', r.status === 403, r.status);

  r = await req('DELETE', `/comments/${comment.id}`, { token: other.data.accessToken });
  check('another user cannot delete my comment (403)', r.status === 403, r.status);

  section('cascade + cleanup');
  r = await req('DELETE', `/tasks/${task.id}`, { token });
  check('delete returns 200', r.status === 200, r.status);

  r = await req('GET', `/tasks/${task.id}`, { token });
  check('deleted task returns 404', r.status === 404, r.status);

  r = await req('GET', `/tasks/${subtask.id}`, { token });
  check('subtask cascaded with parent (404)', r.status === 404, r.status);

  section('projects');
  r = await req('GET', '/projects', { token });
  check('projects list returns seeded rows', r.data?.total === 3, r.data?.total);
  check('projects expose lead and task count', r.data?.items?.[0]?.taskCount !== undefined);

  r = await req('POST', '/projects', { token, body: { name: 'Smoke project', priority: 'medium' } });
  check('project create returns 201', r.status === 201, r.status);
  const project = r.data;

  r = await req('GET', `/projects/${project.id}`, { token });
  check('project fetch by id returns 200', r.status === 200, r.status);

  r = await req('DELETE', `/projects/${project.id}`, { token });
  check('project delete returns 200', r.status === 200, r.status);

  r = await req('GET', '/tasks/does-not-exist', { token });
  check('unknown task id returns 404', r.status === 404, r.status);

  section('users');
  r = await req('GET', '/users', { token });
  check('users list returns members', Array.isArray(r.data) && r.data.length > 0, r.data?.length);

  r = await req('PATCH', '/users/me', { token, body: { title: 'Engineer' } });
  check('profile update applies', r.data?.title === 'Engineer', r.data?.title);

  r = await req('PATCH', '/users/me', { token, body: { email: 'not-an-email' } });
  check('invalid email rejected (400)', r.status === 400, r.status);

  console.log(
    `\n\x1b[36m========================\x1b[0m\npassed: ${passed}   failed: ${failed}\n`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Smoke run crashed:', error);
  process.exit(1);
});
