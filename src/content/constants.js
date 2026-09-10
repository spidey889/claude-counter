(() => {
	'use strict';

	const CC = (globalThis.ClaudeCounter = globalThis.ClaudeCounter || {});

	CC.DOM = Object.freeze({
		// claude.ai has replaced chat-menu-trigger with chat-title-split / chat-title-button / conversation-title.
		// We match all candidates in order of preference, including legacy fallbacks.
		CHAT_HEADER_ANCHOR: '[data-testid="chat-title-split"], [data-testid="chat-title-button"], [data-testid="conversation-title"], [data-testid="chat-menu-trigger"], header [data-testid*="title"], header h1',
		CHAT_HEADER: '[data-testid="chat-header"], header',
		CHAT_INPUT: '[data-testid="chat-input"], div[contenteditable="true"], textarea',
		CHAT_COMPOSER: '[data-cds="ChatComposer"], .bg-surface-3, fieldset, form',
		MODEL_SELECTOR_DROPDOWN: '[data-testid="model-selector-dropdown"], button[aria-haspopup="menu"][data-testid*="model"], [data-testid*="model-picker"]',
		CHAT_MENU_TRIGGER: '[data-testid="chat-title-split"], [data-testid="chat-title-button"], [data-testid="conversation-title"], [data-testid="chat-menu-trigger"]',
		CHAT_PROJECT_WRAPPER: '.chat-project-wrapper',
		BRIDGE_SCRIPT_ID: 'cc-bridge-script'
	});

	CC.CONST = Object.freeze({
		CACHE_WINDOW_MS: 5 * 60 * 1000,
		CONTEXT_LIMIT_TOKENS: 200000
	});

	CC.COLORS = Object.freeze({
		PROGRESS_FILL_DARK: '#2c84db',
		PROGRESS_FILL_LIGHT: '#5aa6ff',
		PROGRESS_OUTLINE_DARK: '#787877',
		PROGRESS_OUTLINE_LIGHT: '#bfbfbf',
		PROGRESS_MARKER_DARK: '#ffffff',
		PROGRESS_MARKER_LIGHT: '#111111',
		RED_WARNING: '#ce2029',
		BOLD_LIGHT: '#141413',
		BOLD_DARK: '#faf9f5'
	});

	// Diagnostic warnings so future DOM changes leave breadcrumbs in the console
	const warnedKeys = new Set();
	CC.warnOnce = (key, message) => {
		if (warnedKeys.has(key)) return;
		warnedKeys.add(key);
		console.warn(`[Claude Counter] ${message}`);
	};
})();
