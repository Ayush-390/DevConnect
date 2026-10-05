// ---------- helpers ----------
const $ = s => document.querySelector(s);
const toast = msg => {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.id); toast.id = setTimeout(() => t.classList.remove('show'), 2200);
};
let user = null;

// ---------- animated user counter ----------
const counter = $('#userCount');
new IntersectionObserver(([e], obs) => {
  if (!e.isIntersecting) return;
  const to = +counter.dataset.to; let n = 0;
  const step = setInterval(() => { n += 10; counter.textContent = Math.min(n, to); if (n >= to) clearInterval(step); }, 25);
  obs.disconnect();
}).observe(counter);

// ---------- real-time chat (simulated; swap in Socket.io here) ----------
const channels = {
  react: [['maya', 'Anyone using useOptimistic in production yet?'], ['dev_raj', 'Yes, great for like buttons.']],
  node: [['sam', 'Express 5 error handling is so much cleaner.'], ['lin', 'Agreed. No more try/catch wrappers.']],
  devops: [['ola', 'NGINX reverse proxy config for WebSockets needs the Upgrade header.'], ['kai', 'Classic gotcha. Saved me an hour.']]
};
const replies = ['Nice, thanks for sharing!', 'Good point. Have you tried it with Socket.io?', 'Same here, works well on EC2.', 'Can you post a snippet?'];
const people = ['maya', 'dev_raj', 'sam', 'lin', 'ola', 'kai'];
let current = 'react';

function renderMsgs() {
  const box = $('#msgs');
  box.innerHTML = '';
  channels[current].forEach(([who, text]) => {
    const d = document.createElement('div');
    d.className = 'msg' + (who === 'me' ? ' me' : '');
    const b = document.createElement('b'); b.textContent = who === 'me' ? (user?.name || 'you') : who;
    d.append(b, text); box.append(d);
  });
  box.scrollTop = box.scrollHeight;
}
function renderTabs() {
  const tabs = $('#channels'); tabs.innerHTML = '';
  Object.keys(channels).forEach(c => {
    const b = document.createElement('button');
    b.textContent = '#' + c; b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', c === current);
    b.onclick = () => { current = c; $('#typing').hidden = true; renderTabs(); renderMsgs(); };
    tabs.append(b);
  });
}
$('#chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#chatInput'), text = input.value.trim(); if (!text) return;
  const room = current;
  channels[room].push(['me', text]); input.value = ''; renderMsgs();
  $('#typing').hidden = false;
  setTimeout(() => {
    channels[room].push([people[Math.random() * people.length | 0], replies[Math.random() * replies.length | 0]]);
    if (room === current) { $('#typing').hidden = true; renderMsgs(); }
  }, 1200);
});

// ---------- post feed ----------
const posts = [
  { name: 'maya', tag: 'react', text: 'Shipped a profile page with drag-and-drop avatars today.', likes: 12, liked: false },
  { name: 'sam', tag: 'node', text: 'Moved our JWT refresh logic into middleware. Far fewer 401s.', likes: 8, liked: false },
  { name: 'ola', tag: 'devops', text: 'Tip: set proxy_read_timeout in NGINX so idle sockets stay open.', likes: 21, liked: false }
];
let filter = 'all';
const colors = ['#3b4ef0', '#12a36b', '#c2410c', '#9333ea', '#0e7490'];

function renderFilters() {
  const f = $('#filters'); f.innerHTML = '';
  ['all', 'react', 'node', 'devops'].forEach(t => {
    const b = document.createElement('button'); b.className = 'pill'; b.textContent = t === 'all' ? 'All' : '#' + t;
    b.setAttribute('aria-pressed', t === filter); b.onclick = () => { filter = t; renderFilters(); renderPosts(); };
    f.append(b);
  });
}
function renderPosts() {
  const box = $('#posts'); box.innerHTML = '';
  const list = posts.filter(p => filter === 'all' || p.tag === filter);
  if (!list.length) { box.innerHTML = '<p class="empty">No posts in this tag yet. Write the first one above.</p>'; return; }
  list.forEach(p => {
    const el = document.createElement('article'); el.className = 'post';
    const av = document.createElement('div'); av.className = 'avatar';
    av.textContent = p.name[0].toUpperCase(); av.style.background = colors[p.name.charCodeAt(0) % colors.length];
    const who = document.createElement('div'); who.innerHTML = '<strong></strong><br><small></small>';
    who.querySelector('strong').textContent = p.name; who.querySelector('small').textContent = '#' + p.tag;
    const head = document.createElement('header'); head.append(av, who);
    const body = document.createElement('p'); body.textContent = p.text;
    const like = document.createElement('button'); like.className = 'like';
    like.setAttribute('aria-pressed', p.liked); like.textContent = (p.liked ? '♥ ' : '♡ ') + p.likes;
    like.onclick = () => { p.liked = !p.liked; p.likes += p.liked ? 1 : -1; renderPosts(); };
    el.append(head, body, like); box.append(el);
  });
}
$('#postForm').addEventListener('submit', e => {
  e.preventDefault();
  const text = $('#postText').value.trim(); if (!text) return;
  posts.unshift({ name: user?.name || 'guest', tag: $('#postTag').value, text, likes: 0, liked: false });
  $('#postText').value = ''; filter = 'all'; renderFilters(); renderPosts(); toast('Posted');
});

// ---------- tech stack chips ----------
const stack = {
  React: 'Builds the interface: chat, feed and profile pages.',
  'Node.js': 'Runs the server and handles each connected client.',
  Express: 'Provides the REST routes for auth, profiles and posts.',
  MongoDB: 'Stores users, posts and message history.',
  'Socket.io': 'Pushes chat messages to everyone in a channel instantly.',
  AWS: 'EC2 hosts the app, with NGINX proxying traffic to Node.'
};
Object.entries(stack).forEach(([name, info]) => {
  const c = document.createElement('button'); c.className = 'chip'; c.textContent = name; c.setAttribute('aria-pressed', false);
  c.onclick = () => {
    document.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === c));
    $('#chipInfo').textContent = info;
  };
  $('#chips').append(c);
});

// ---------- demo sign-in with a sample JWT ----------
const b64 = o => btoa(JSON.stringify(o)).replace(/=+$/, '');
const dlg = $('#authDlg');
const openAuth = () => dlg.showModal();
$('#authBtn').onclick = () => { if (user) { user = null; $('#authBtn').textContent = 'Sign in'; renderMsgs(); toast('Signed out'); } else openAuth(); };
$('#heroJoin').onclick = openAuth;
$('#authSubmit').addEventListener('click', e => {
  const f = $('#authForm');
  if (!f.checkValidity()) return;        // let the browser show validation messages
  e.preventDefault();
  const name = $('#uName').value.trim();
  const now = Math.floor(Date.now() / 1000);
  const jwt = [b64({ alg: 'HS256', typ: 'JWT' }), b64({ sub: name, iat: now, exp: now + 3600 }), 'demo-signature-not-real'].join('.');
  user = { name }; $('#authBtn').textContent = 'Sign out (' + name + ')';
  const pre = $('#token'); pre.hidden = false; pre.textContent = jwt;
  renderMsgs(); toast('Signed in as ' + name);
});

renderTabs(); renderMsgs(); renderFilters(); renderPosts();
