<template>
	<div ref="container" id="footNavBox">
		<div class="footNav">
			<div id="footNavClassify">
				<footNavItem :list="footNavList" />
			</div>
			<div id="aboutusBox">
				<footNavItem :list="aboutusList" />
			</div>
		</div>
		<div class="hbLogo"></div>
		<div class="introduce">
			<template v-for="col in about">
				<div class="introduce-item" :key="col.title">
					<span class="introduce-title">{{ col.title }}：</span>
					<template v-for="(item, index) in col.content">
						<a class="navItemDetail" :key="item.url" :href="item.url" target="_blank">
							{{ item.subTitle }}
						</a>
					</template>
				</div>
			</template>
		</div>
		<div v-if="$lang === LOCALE_ZH_HANS">
			<div class="companyBox">

				<span class="companyInfo"><span class="companyInfo-dcloud">DCloud.io</span>&nbsp;数字天堂（北京）网络技术有限公司是</span>
				<div style="display: inline; margin-left: 5px" class="companyInfo">
					<!-- <a href="//www.w3.org/" target="_blank" class="w3c">W3C</a>
					成员及 -->
					<a href="//www.html5plus.org/" target="_blank" class="html5">HTML5中国产业联盟</a>
					发起单位
				</div>
			</div>
			<div class="beianBox">
				<a
					id="domain"
					class="beian"
					href="https://beian.miit.gov.cn/#/Integrated/index"
					target="_blank"
				>
					{{ domain }}
				</a>
				<div class="domainImgBox">
					<img class="domainImg" :src="domainImg" />
					<a class="beian" :href="beian" target="_blank">京公网安备：11010802035340号&nbsp;</a>
				</div>

				<span class="anbaoInfo">&nbsp;&nbsp;国家信息安全等级保护三级，证书编号：11010813802-20001</span>
			</div>
		</div>
	</div>
</template>

<script>
	import footerConfig from '@theme-config/footer';
	import { LOCALE_ZH_HANS } from '@theme-config/i18n';
	const { footNavList, aboutusList, aboutus, concatus, domainImg, beian } = footerConfig;

	export default {
		components: {
			footNavItem: {
				functional: true,
				props: {
					list: {
						type: Array,
						default: () => [],
					},
				},
				render: (h, { props }) => {
					return props.list.map((footNavListItem, _index) =>
						h('div', { staticClass: 'footNavItem', key: footNavListItem.title || _index }, [
							h('div', { staticClass: 'navItemTitle' }, footNavListItem.title),
							h('div', { staticClass: 'navLine' }),
							h(
								'div',
								{ staticClass: 'navItemDetailBox' },
								footNavListItem.content.map((item, index) =>
									h(
										'a',
										{
											staticClass: 'navItemDetail',
											key: item.url || index,
											attrs: {
												target: '_blank',
												href: item.url,
											},
										},
										item.subTitle
									)
								)
							),
						])
					);
				},
			},
		},
		data: () => ({
			footNavList: Object.freeze(footNavList),
			aboutusList: Object.freeze(aboutusList),
			about: Object.freeze([aboutus, concatus]),
			domain: '',
			domainImg,
			beian,
			LOCALE_ZH_HANS,
		}),
		mounted() {
			if (location.hostname === 'uniapp.dcloud.io') {
				this.domain = '蒙ICP备14002744号-1';
			} else {
				this.domain = '京ICP备12046007号-4';
			}
			this.fixBottom();
		},
		methods: {
			fixBottom() {
				this.$nextTick(() => {
					this.$refs.container.style.bottom = `0px`;
					const bottom =
						document.documentElement.clientHeight -
						this.$refs.container.getBoundingClientRect().bottom;
					if (bottom > 0) {
						// const preBottom = parseFloat(this.$refs.container.style.bottom);
						this.$refs.container.style.position = 'relative';
						this.$refs.container.style.bottom = `-${bottom}px`;
					} else {
						this.$refs.container.removeAttribute('style');
					}
				});
			},
		},
		watch: {
			$route() {
				this.fixBottom();
			},
		},
	};
</script>

<style lang="stylus" scoped>
	@import '../styles/footer.styl'
</style>
