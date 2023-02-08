<template>
	<div class="contact-box">
		<template v-if="currentConfig.contactItems && currentConfig.contactItems.length">
			<template v-for="item in currentConfig.contactItems">
				<a :key="item.name" :href="item.url" target="_blank" class="contact-item">
					<img :src="item.imageUrl" width="20" height="20" />
					<div class="contact-smg">
						<div>{{ item.name }}</div>
					</div>
				</a>
			</template>
		</template>
		<div class="contact-item" v-if="currentConfig.codeHosting && currentConfig.codeHosting.length">
			<img
				src="https://web-assets.dcloud.net.cn/unidoc/zh/git-1.png"
				width="20"
				height="20"
			/>
			<div class="contact-smg">
				<div>
					代码仓库：
					<template v-for="(item, index) in currentConfig.codeHosting">
						<a :key="item.url" :href="item.url" target="_blank">{{ item.name }}</a>
						{{ currentConfig.codeHosting.length - index > 1 ? '、' : '' }}
					</template>
				</div>
			</div>
		</div>
		<div class="contact-item" v-if="currentQQGroup.length">
			<img
				src="https://web-assets.dcloud.net.cn/unidoc/zh/qq_logo_blue.png"
				width="20"
				height="20"
			/>
			<div class="contact-smg">
				<div>官方QQ交流群</div>
				<template v-for="item in currentQQGroup">
					<div v-if="!item.state" :key="item.number">
						{{ item.prefix }}：{{ item.number }} &nbsp;
						<a target="_blank" style="text-decoration: underline" :href="item.joinQQGroupHref">
							点此加入
						</a>
					</div>
					<div v-else :key="item.prefix">
						{{ item.prefix }}：{{ item.number }}（{{ item.attendance || 2000 }}人已满）
					</div>
				</template>
			</div>
		</div>
		<div class="contact-item">
			<img
				src="https://web-assets.dcloud.net.cn/unidoc/zh/weixin@2x.png"
				width="20"
				height="20"
			/>
			<div class="contact-smg">
				<div>关注微信公众号</div>
				<img :src="weChatOfficialAccountImg" width="90" height="90" />
			</div>
		</div>
	</div>
</template>

<script>
	import navInject from '../mixin/navInject';
	import siderbarConfig from '@theme-config/siderbar';

	const { weChatOfficialAccountImg } = siderbarConfig;

	export default {
		mixins: [navInject],

		data: () => ({
			weChatOfficialAccountImg,
		}),

		computed: {
			currentConfig() {
				return siderbarConfig[this.customNavBarLinks[this.navConfig.userNavIndex]] || {};
			},
			currentQQGroup() {
				return [...(this.currentConfig.qq_group || [])].reverse();
			},
			joinQQGroupHref() {
				return this.currentConfig.joinQQGroupHref || '';
			},
		},
	};
</script>

<style>
	.contact-box {
		border-top: 1px solid #eee;
		margin-top: 20px;
		margin-bottom: 20px;
		padding: 0 10px;
	}

	.contact-box a {
		color: #42b983;
	}

	.contact-item {
		padding-top: 30px;
		padding-left: 0;
		display: flex;
		flex-direction: row;
	}

	a.contact-item {
		display: flex;
		padding: 0;
		margin-top: 20px;
		padding-left: 0;
		text-decoration: none;
	}

	.contact-item > img {
		margin: 3px 10px 0 10px;
	}

	.contact-smg {
		display: flex;
		flex-direction: column;
	}

	.contact-smg div {
		font-size: 15px;
		color: #000000;
		line-height: 24px;
	}
</style>
