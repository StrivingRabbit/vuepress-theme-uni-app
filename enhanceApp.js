import getRedirectRouter from '@theme-config/redirectRouter';
import VueRouter from 'vue-router';
import { isServer } from './util';
import OutboundLink from '@theme/components/OutboundLink.vue';

const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location, resolve, reject) {
	if (resolve || reject) return originalPush.call(this, location, resolve, reject);
	return originalPush.call(this, location).catch(err => err);
};

function handleRedirectForCleanUrls(router, to) {
	if (isRouteExists(router, to.path)) {
		return to.path;
	} else {
		if (!/(\/|\.html)$/.test(to.path)) {
			const endingSlashUrl = to.path + '/';
			const endingHtmlUrl = to.path + '.html';
			if (isRouteExists(router, endingHtmlUrl)) {
				return endingHtmlUrl;
			} else if (isRouteExists(router, endingSlashUrl)) {
				return endingSlashUrl;
			} else {
				return to.path.replace(/\.md$/, '');
			}
		} else if (/\/$/.test(to.path)) {
			const endingHtmlUrl = to.path.replace(/\/$/, '') + '.html';
			if (isRouteExists(router, endingHtmlUrl)) {
				return endingHtmlUrl;
			} else {
				return to.path;
			}
		} else {
			return to.path;
		}
	}
}

function isRouteExists(router, path) {
	const pathLower = path.toLowerCase();
	return router.options.routes.some(route => route.path.toLowerCase() === pathLower);
}

function resolveRouterBase(router, redirectPath) {
	if (router.options.base !== '/') redirectPath = (router.options.base + redirectPath).replace(/\/\//g, '/');
	return redirectPath;
}

function handlePath(router, to) {
	// 重定向路由表
	const redirectRouter = getRedirectRouter(to);
	if (redirectRouter && !isServer) return location.replace(redirectRouter.path + (redirectRouter.hash || ''));

	const id = to.query.id;
	delete to.query.id;
	let hash = decodeURIComponent(id || to.hash).toLowerCase();
	if (hash && hash.indexOf('#') !== 0) hash = '#' + hash;
	const redirectPath = handleRedirectForCleanUrls(router, to);
	if (id) {
		return {
			path: resolveRouterBase(router, redirectPath),
			replace: true,
			hash,
			query: to.query,
		};
	}
	if (redirectPath !== to.path) {
		return {
			path: resolveRouterBase(router, redirectPath),
			replace: true,
			hash,
			query: to.query,
		};
	}
	if (/\bREADME\b/.test(to.path)) {
		return {
			path: to.path.replace(/\bREADME\b/, ''),
			replace: true,
			hash,
			query: to.query,
		};
	}
}

export default ({ Vue, options, router, siteData }) => {
	let mounted = Vue.$vuepress.store._isMounted;
	// debugger
	const ScrollBehavior = 'instant';

	router.beforeHooks.unshift((to, from, next) => {
		const _next = handlePath(router, to);
		if (_next && /\.html$/.test(_next.path) && !isServer) return location.replace(_next.path + (_next.hash || ''));
		else next(_next);
	});

	router.options.scrollBehavior = function scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return window.scrollTo({
				top: savedPosition.y,
				behavior: ScrollBehavior,
			});
		} else if (to.hash) {
			if (Vue.$vuepress.$get('disableScrollBehavior')) {
				return false;
			}
			const selector = decodeURIComponent(to.hash.toLowerCase());
			return new Promise((resolve, reject) => {
				setTimeout(
					() => {
						if (!mounted) mounted = true;
						const targetElement = document.querySelector(selector);
						if (targetElement) {
							return window.scrollTo({
								top: getElementPosition(targetElement).y,
								behavior: ScrollBehavior,
							});
						}
						return resolve(false);
					},
					mounted ? 0 : 700
				);
			});
		} else {
			return window.scrollTo({
				top: 0,
				behavior: ScrollBehavior,
			});
		}
	};

	if (!isServer) {
		const toggleChildrenTableClassName = 'toggle-children-table';
		router.afterEach((to, from) => {
			setTimeout(
				() => {
					if (!mounted) mounted = true;
					// 表格折叠打开
					[...document.getElementsByClassName('have-children-tr')].forEach(tr => {
						const firstTD = tr.firstChild;
						const firstTDChild = firstTD.firstChild;
						if (firstTDChild.className !== toggleChildrenTableClassName) {
							const i = document.createElement('i');
							i.setAttribute('class', toggleChildrenTableClassName);
							firstTD.insertBefore(i, firstTDChild);
						}
					});
					[...document.getElementsByClassName(toggleChildrenTableClassName)].forEach(toggleChildrenTable => {
						if (toggleChildrenTable) {
							toggleChildrenTable.onclick = function () {
								const childrenTable = this.parentElement.parentElement.nextElementSibling;
								const isHidden = childrenTable.getAttribute('hidden');
								if (isHidden === null) {
									this.classList.remove('opened')
									childrenTable.setAttribute('hidden', '');
								} else {
									this.classList.add('opened')
									childrenTable.removeAttribute('hidden');
								}
							};
						}
					});
				},
				mounted ? 0 : 700
			);
		});
	}

	Vue.component('OutboundLink', OutboundLink);
};

function getElementPosition(el) {
	const docEl = document.documentElement;
	const docRect = docEl.getBoundingClientRect();
	const elRect = el.getBoundingClientRect();
	return {
		x: elRect.left - docRect.left,
		y: elRect.top - docRect.top,
	};
}
