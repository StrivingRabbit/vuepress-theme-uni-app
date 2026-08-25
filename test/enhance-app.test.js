const assert = require('assert')
const fs = require('fs')
const path = require('path')

function loadEnhanceApp(dependencies) {
	const file = path.resolve(__dirname, '../enhanceApp.js')
	const source = fs
		.readFileSync(file, 'utf8')
		.replace("import getRedirectRouter from '@theme-config/redirectRouter';", 'const getRedirectRouter = dependencies.getRedirectRouter;')
		.replace("import VueRouter from 'vue-router';", 'const VueRouter = dependencies.VueRouter;')
		.replace("import { isServer } from './util';", 'const isServer = dependencies.isServer;')
		.replace("import OutboundLink from '@theme/components/OutboundLink.vue';", 'const OutboundLink = {};')
		.replace('export default ({ Vue, router }) => {', 'const enhanceApp = ({ Vue, router }) => {')

	return new Function('dependencies', `${source}\nreturn enhanceApp;`)(dependencies)
}

function createVueRouter() {
	function VueRouter() {}
	VueRouter.START_LOCATION = {}
	VueRouter.NavigationFailureType = { duplicated: 16 }
	VueRouter.isNavigationFailure = (error, type) => error.type === type
	VueRouter.prototype.push = function push(location) {
		const error = new Error(location)
		error.type = location === 'duplicated' ? 16 : 1
		return Promise.reject(error)
	}
	return VueRouter
}

function createHarness(options = {}) {
	const VueRouter = createVueRouter()
	let nextValue
	const router = {
		beforeHooks: [],
		options: {
			base: '/docs/',
			routes: options.routes || [{ path: '/' }, { path: '/guide' }],
		},
		resolve(target) {
			const query = Object.keys(target.query || {})
				.map(key => `${key}=${target.query[key]}`)
				.join('&')
			return {
				href: `/docs${target.path}${query ? `?${query}` : ''}${target.hash || ''}`,
			}
		},
	}
	const Vue = {
		$vuepress: {
			$get: () => Boolean(options.disableScroll),
		},
		component() {},
	}
	const enhanceApp = loadEnhanceApp({
		VueRouter,
		getRedirectRouter: options.getRedirectRouter || (() => null),
		isServer: false,
	})
	enhanceApp({ Vue, router })

	return {
		VueRouter,
		router,
		runHook(to) {
			router.beforeHooks[0](to, {}, value => {
				nextValue = value
			})
			return nextValue
		},
	}
}

async function run() {
	const originalDocument = global.document
	const originalLocation = global.location
	const originalSetTimeout = global.setTimeout
	const originalWindow = global.window

	try {
		global.window = { pageXOffset: 4, pageYOffset: 20 }
		global.document = {
			getElementById(id) {
				return id === 'A.B%' ? { getBoundingClientRect: () => ({ top: 80 }) } : null
			},
		}
		global.location = {
			replace(href) {
				this.href = href
			},
		}

		const harness = createHarness()
		assert.deepStrictEqual(
			harness.router.options.scrollBehavior({}, {}, null),
			{ x: 0, y: 0, behavior: 'instant' },
		)
		const normalPosition = harness.router.options.scrollBehavior(
			{ hash: '#A.B%25' },
			{ path: '/guide' },
			null,
		)
		assert.deepStrictEqual(normalPosition, { x: 4, y: 100, behavior: 'instant' })
		assert.deepStrictEqual(
			harness.router.options.scrollBehavior({ hash: '#A.B%' }, { path: '/guide' }, null),
			normalPosition,
		)
		assert.deepStrictEqual(
			harness.router.options.scrollBehavior({}, {}, { x: 2, y: 3 }),
			{ x: 2, y: 3, behavior: 'instant' },
		)
		assert.strictEqual(
			createHarness({ disableScroll: true }).router.options.scrollBehavior({ hash: '#A.B%25' }, {}, null),
			false,
		)

		let delay
		global.setTimeout = (callback, timeout) => {
			delay = timeout
			callback()
		}
		const initialHarness = createHarness()
		const initialPosition = await initialHarness.router.options.scrollBehavior(
			{ hash: '#A.B%25' },
			{ path: '/redirected' },
			null,
		)
		assert.strictEqual(delay, 700)
		assert.deepStrictEqual(initialPosition, normalPosition)

		const to = { path: '/guide', hash: '', query: { id: 'A.B%25', keep: 'yes' } }
		const redirected = harness.runHook(to)
		assert.deepStrictEqual(to.query, { id: 'A.B%25', keep: 'yes' })
		assert.deepStrictEqual(redirected, {
			path: '/guide',
			replace: true,
			hash: '#A.B%',
			query: { keep: 'yes' },
		})

		const readme = harness.runHook({ path: '/guide/README.md', hash: '', query: {} })
		assert.strictEqual(readme.path, '/guide/')

		const cleanUrlHarness = createHarness({ routes: [{ path: '/guide.html' }] })
		cleanUrlHarness.runHook({ path: '/guide', hash: '#part', query: { keep: 'yes' } })
		assert.strictEqual(global.location.href, '/docs/guide.html?keep=yes#part')

		const configuredRedirectHarness = createHarness({
			getRedirectRouter: () => ({ path: '/target.html', hash: '#part', query: { keep: 'yes' } }),
		})
		configuredRedirectHarness.runHook({ path: '/source', hash: '', query: {} })
		assert.strictEqual(global.location.href, '/docs/target.html?keep=yes#part')
		const externalRedirectHarness = createHarness({
			getRedirectRouter: () => ({ path: '//example.com/target', hash: '#part' }),
		})
		externalRedirectHarness.runHook({ path: '/source', hash: '', query: {} })
		assert.strictEqual(global.location.href, '//example.com/target#part')

		const routerInstance = new harness.VueRouter()
		const duplicated = await routerInstance.push('duplicated')
		assert.strictEqual(duplicated.type, 16)
		await assert.rejects(routerInstance.push('failed'), /failed/)

		console.log('ok - enhanceApp routing and anchor behavior')
	} finally {
		global.document = originalDocument
		global.location = originalLocation
		global.setTimeout = originalSetTimeout
		global.window = originalWindow
	}
}

run().catch(error => {
	console.error('not ok - enhanceApp')
	console.error(error.stack)
	process.exitCode = 1
})
