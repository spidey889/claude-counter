'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const limit = { windows: {
	'5h': { utilization: 0.237, resets_at: 1893492000 },
	'7d': { utilization: 0.041, resets_at: 1894000000 }
} };
const completion = 'https://claude.ai/api/organizations/test-org/chat_conversations/test-chat/completion';
const turn = () => new Promise(setImmediate);

// Real Fetch/Response streams; only Claude's transport and the UI are replaced.
// Simulating a page that saves fetch at bootstrap catches late extension hooks.
function browserHarness(wire, chunks = [wire]) {
	const listeners = new Map();
	const messages = [];
	const snapshots = [];
	const calls = [];
	const timers = new Set();
	const window = {
		location: { pathname: '/chat/test-chat' },
		addEventListener(type, fn) {
			if (!listeners.has(type)) listeners.set(type, new Set());
			listeners.get(type).add(fn);
		},
		removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
		dispatchEvent(event) { for (const fn of listeners.get(event.type) || []) fn(event); },
		postMessage(data) {
			const copied = JSON.parse(JSON.stringify(data));
			messages.push(copied);
			queueMicrotask(() => window.dispatchEvent({ type: 'message', source: window, data: copied }));
		},
		async fetch(input, options) {
			const url = typeof input === 'string' ? input : input.url;
			calls.push({ url, options });
			if (url.endsWith('/usage')) return Response.json({ five_hour: null, seven_day: null });
			if (!url.endsWith('/completion')) return Response.json({});
			return new Response(new ReadableStream({ start(controller) {
				for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
				controller.close();
			} }), { headers: { 'content-type': 'text/event-stream' } });
		}
	};
	const ui = {
		initialize() {}, attachUsageLine() {}, attachHeader() {}, tick() {},
		setPendingCache() {}, setConversationMetrics() {},
		setUsage(value) { snapshots.push(JSON.parse(JSON.stringify(value))); }
	};
	const globals = {
		window, history: { pushState() {}, replaceState() {} }, URL, Request, TextDecoder, TextEncoder,
		CustomEvent: class { constructor(type) { this.type = type; } },
		MutationObserver: class { observe() {} disconnect() {} },
		document: {
			cookie: 'lastActiveOrg=test-org', hidden: false,
			querySelector() { return {}; }, addEventListener() {}
		},
		setTimeout(fn, delay) {
			const timer = setTimeout(fn, delay);
			timers.add(timer);
			return timer;
		},
		clearTimeout(timer) { clearTimeout(timer); timers.delete(timer); },
		setInterval() {},
		ClaudeCounter: {
			ui: { CounterUI: function () { return ui; } },
			tokens: { async computeConversationMetrics() { return {}; } }
		}
	};
	const page = vm.createContext({ ...globals });
	const isolated = vm.createContext({ ...globals });
	function run(context, file) {
		vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
	}
	function load(stage) {
		for (const entry of manifest.content_scripts) {
			if ((entry.run_at || 'document_idle') !== stage) continue;
			for (const file of entry.js || []) {
				if (/vendor|tokens\.js|ui\.js/.test(file)) continue;
				run(entry.world === 'MAIN' ? page : isolated, file);
			}
		}
	}
	return {
		window, messages, snapshots, calls, load,
		loadBridge() { run(page, 'src/injected/bridge.js'); },
		async settle() { for (let i = 0; i < 8; i++) await turn(); },
		close() { for (const timer of timers) clearTimeout(timer); }
	};
}

test('a page-cached fetch updates free-account bars after an ordinary reply', async (t) => {
	const wire = `event: message_limit\ndata: ${JSON.stringify({ type: 'message_limit', message_limit: limit })}\n\n`;
	const browser = browserHarness(wire);
	t.after(() => browser.close());
	browser.load('document_start');
	const appFetch = browser.window.fetch;
	browser.load('document_idle');
	await browser.settle();
	assert.equal(browser.snapshots.length, 0, 'null REST windows must stay unavailable');
	const response = await appFetch(completion, { method: 'POST' });
	assert.equal(await response.text(), wire, 'observing usage must preserve the app stream');
	await browser.settle();
	assert.equal(browser.snapshots.at(-1)?.five_hour.utilization, 23.7);
	assert.ok(Math.abs(browser.snapshots.at(-1)?.seven_day.utilization - 4.1) < 0.000001);
	assert.equal(browser.calls.filter(call => call.url.endsWith('/completion')).length, 1);
});

test('SSE event names identify quota events across split CRLF and multiline data', async (t) => {
	const wire = `event: message_limit\r\ndata: {"message_limit":\r\ndata: ${JSON.stringify(limit)}}\r\n\r\n`;
	const chunks = Array.from(wire); // Each byte/CRLF may arrive separately.
	const browser = browserHarness(wire, chunks);
	t.after(() => browser.close());
	browser.loadBridge();
	const response = await browser.window.fetch(completion, { method: 'POST' });
	assert.equal(await response.text(), wire);
	await browser.settle();
	assert.deepEqual(browser.messages.find(message => message.type === 'cc:message_limit')?.payload, limit);
});

test('legacy JSON event types and a final unterminated data line still work', async (t) => {
	const wire = `data: ${JSON.stringify({ type: 'message_limit', message_limit: limit })}`;
	const browser = browserHarness(wire);
	t.after(() => browser.close());
	browser.loadBridge();
	await (await browser.window.fetch(completion)).text();
	await browser.settle();
	assert.deepEqual(browser.messages.find(message => message.type === 'cc:message_limit')?.payload, limit);
});

test('Request objects emit generation start using their own POST method', async (t) => {
	const browser = browserHarness('data: {"type":"message_stop"}\n\n');
	t.after(() => browser.close());
	browser.loadBridge();
	await (await browser.window.fetch(new Request(completion, { method: 'POST' }))).text();
	assert.equal(browser.messages.filter(message => message.type === 'cc:generation_start').length, 1);
});

test('an early quota event is replayed when the isolated UI connects', async (t) => {
	const wire = `event: message_limit\ndata: ${JSON.stringify({ type: 'message_limit', message_limit: limit })}\n\n`;
	const browser = browserHarness(wire);
	t.after(() => browser.close());
	browser.load('document_start');
	await (await browser.window.fetch(completion, { method: 'POST' })).text();
	await browser.settle();
	browser.load('document_idle');
	await browser.settle();
	assert.equal(browser.snapshots.at(-1)?.five_hour.utilization, 23.7);
});
