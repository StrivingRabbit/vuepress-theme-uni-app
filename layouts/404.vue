<template>
	<div class="theme-container">
		<!-- <div class="theme-default-content">
			<h1>404</h1>

			<blockquote>{{ getMsg() }}</blockquote>

			<RouterLink to="/">Take me home.</RouterLink>
		</div> -->
	</div>
</template>

<script>
	import { isServer } from '../util';

	export default {
		created() {
			if (isServer) return;
			this.$router.push('/');
		},
	};
</script>
