import getRedirectRouter from '@theme-config/redirectRouter';
import VueRouter from 'vue-router';
import { isServer } from './util';
import OutboundLink from '@theme/components/OutboundLink.vue';

const INITIAL_HASH_DELAY = 700;
const SCROLL_BEHAVIOR = 'instant';
const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location, resolve, reject) {
	if (resolve || reject) return originalPush.call(this, location, resolve, reject);
	return originalPush.call(this, location).catch(err => {
		if (VueRouter.isNavigationFailure(err, VueRouter.NavigationFailureType.duplicated)) return err;
		throw err;
	});
};

function handleRedirectForCleanUrls(router, to) {
	if (isRouteExists(router, to.path)) return to.path;
	if (!/(\/|\.html)$/i.test(to.path)) {
		const endingSlashUrl = to.path + '/';
		const endingHtmlUrl = to.path + '.html';
		if (isRouteExists(router, endingHtmlUrl)) return endingHtmlUrl;
		if (isRouteExists(router, endingSlashUrl)) return endingSlashUrl;
		return to.path.replace(/\.md$/i, '');
	}
	if (/\/$/.test(to.path)) {
		const endingHtmlUrl = to.path.replace(/\/$/, '') + '.html';
		if (isRouteExists(router, endingHtmlUrl)) return endingHtmlUrl;
	}
	return to.path;
}

function isRouteExists(router, path) {
	const pathLower = path.toLowerCase();
	return router.options.routes.some(route => route.path.toLowerCase() === pathLower);
}

function normalizeHash(value) {
	if (Array.isArray(value)) value = value[0];
	if (typeof value !== 'string') return '';
	let decodedValue;
	try {
		decodedValue = decodeURIComponent(value);
	} catch (error) {
		decodedValue = value;
	}
	return decodedValue && decodedValue.charAt(0) !== '#' ? `#${decodedValue}` : decodedValue;
}

function replaceLocation(router, target) {
	const isExternal = /^[a-z]+:/i.test(target.path) || target.path.indexOf('//') === 0;
	const href = isExternal ? target.path + (target.hash || '') : router.resolve(target).href;
	location.replace(href);
}

function getHashPosition(hash, behavior) {
	const id = normalizeHash(hash).slice(1);
	const target = id && document.getElementById(id);
	if (!target) return false;
	return {
		x: window.pageXOffset,
		y: target.getBoundingClientRect().top + window.pageYOffset,
		behavior,
	};
}

function handlePath(router, to) {
	const query = { ...to.query };
	const id = query.id;
	delete query.id;
	const hash = normalizeHash(id || to.hash);
	const readmePath = to.path.replace(/(^|\/)README(?:\.(?:md|html))?$/i, '$1');
	const redirectPath = readmePath !== to.path ? readmePath : handleRedirectForCleanUrls(router, to);
	if (!id && redirectPath === to.path) return;
	return {
		path: redirectPath,
		replace: true,
		hash,
		query,
	};
}

export default ({ Vue, router }) => {
	let isFirstScroll = true;

	router.beforeHooks.unshift((to, from, next) => {
		const configuredRedirect = !isServer && getRedirectRouter(to);
		if (configuredRedirect) {
			replaceLocation(router, configuredRedirect);
			return;
		}
		const _next = handlePath(router, to);
		if (_next && /\.html$/i.test(_next.path) && !isServer) {
			replaceLocation(router, _next);
			return;
		}
		next(_next);
	});

	router.options.scrollBehavior = function scrollBehavior(to, from, savedPosition) {
		const shouldDelayHash = isFirstScroll;
		isFirstScroll = false;
		if (savedPosition) return { ...savedPosition, behavior: SCROLL_BEHAVIOR };
		if (!to.hash) return { x: 0, y: 0, behavior: SCROLL_BEHAVIOR };
		if (Vue.$vuepress.$get('disableScrollBehavior')) return false;

		// 带锚点刷新时等待页面内容稳定；页面内点击锚点则立即滚动。
		if (!shouldDelayHash) return getHashPosition(to.hash, SCROLL_BEHAVIOR);
		return new Promise(resolve =>
			setTimeout(() => {
				resolve(getHashPosition(to.hash, SCROLL_BEHAVIOR));
			}, INITIAL_HASH_DELAY),
		);
	};

	Vue.component('OutboundLink', OutboundLink);
};
