<script>
import clientRootMixin from 'vuepress-plugin-juejin-style-copy/clientRootMixin';

export default {
	mixins:[clientRootMixin],
	props:{
		src:{
			type:String,
			default:''
		}
	},
	data(){
		return {
			activeIndex: 0
		}
	},
	mounted(){
		this.$copyUpdates && this.$copyUpdates()
		this.onWindowResize()
		window.addEventListener('resize', this.onWindowResize)
	},
	beforeDestroy(){
		window.removeEventListener('resize', this.onWindowResize)
	},
	methods:{
		onWindowResize(){
			const contentWidth = getComputedStyle(document.querySelector('.theme-default-content')).width
			if (window.matchMedia('(max-width: 410px)').matches) {
				this.$refs.codeIframe.style.maxWidth = contentWidth
			}
		},
		onClick(index){
			this.activeIndex = index
		},
		createdDom(h,node){
			let headerDom = []
			node.forEach((v,index)=>{
				headerDom.push(h('p',{class:`pages-tabs-header-text ${this.activeIndex === index?'pages-tabs--active':''}`,on:{click:(e)=>{
						this.onClick(index)
				}}},v.title),)
			})
			return this.renderDom(h,h('div',{class:'page-tabs'},[
				h('div',{class:'pages-tabs-header'},headerDom),
				h('div',{class:'page-snippet-code',key:this.activeIndex},[node[this.activeIndex].node]),
			]))
		},
		renderDom(h,node){
			return h('div',{class:'page-runtime'},
				[
					h('div',{class:'page-snippet'},[node]),
					h('div',{class:'code-content',style:{display:this.src?'block':'none'}},[
						h('iframe',{class:'code-iframe',attrs:{
							src:this.src,
							frameborder:'0'
						},ref:'codeIframe'})
					]),
				
				]
			)
		}
	},
	render(h){
		const columns = this.$slots.default || []
		let boxObj = []
		let realDom = []
		columns.forEach((v,i)=>{
			if(v.tag && v.children){
				realDom.push(v)
			}
		})
		realDom.forEach((vnode,index)=>{
			let code = vnode.children[0]
			if(vnode.tag === 'div' && code.tag === 'pre'){
				let i = index - 1
				if(i >= 0){
					let textDom = realDom[i]
					if(textDom.tag === 'blockquote'){
						let text = textDom.children[0]
						let p = text.children[0]
						boxObj.push({
							title:p.text,
							node:vnode
						})
					}
					
				}
			}
		})
		if(boxObj.length > 0){
			return h('div',null,[this.createdDom(h,boxObj)])
		}else{
			if(this.src){
				return this.renderDom(h,this.$slots.default)
			}else{
				return h('div',null,this.$slots.default)
			}
		}
	}
}
</script>

<style lang="stylus" scoped>
.page-runtime {
	display: flex;
	max-height: 667px;
	border: 1px #eee solid;
	margin-top: 16px;
}
.page-snippet {
	width: 100%;
	overflow: hidden;

}
.page-snippet-code {
	height: calc(100% - 50px);
}

.page-tabs {
	height: 100%;
	box-sizing: border-box;
}
.pages-tabs-header {
	display: flex;
	height: 50px;
	background-color: #222;
}
.pages-tabs-header-text {
	display: flex;
	flex-direction: column;
	justify-content: center;
	margin: 5px;
	margin-bottom: 0px;
	border-top-left-radius: 5px;
	border-top-right-radius: 5px;
	padding: 0 45px;
	text-align: center;
	font-size: 18px;
	color: #eee;
	background:transparent;
	cursor: pointer;
	-moz-user-select:none; /*火狐*/
    -webkit-user-select:none; /*webkit浏览器*/
    -ms-user-select:none; /*IE10*/
    -khtml-user-select:none; /*早期浏览器*/
    user-select:none;
}
.pages-tabs--active {
	// background:#282c34;
	background-color: #292d3e;
	color: #fff;
	font-weight: bold;
}

.page-snippet div[class*="language-"]{
	width: 100%;
	height: 100%;
	border-radius: 0;
	overflow: auto;

}
.page-snippet pre[class*="language-"]{
	margin: 0;
	padding: 20px 20px;
	width: 100%;
	height: 100%;
	// overflow: auto;
	box-sizing: border-box;
}
.code-iframe {
	flex-shrink: 0;
	width: 375px;
	height: 667px;
}

@media (max-width: $MQMobileNarrow)
	{$contentClass}
    div[class*="language-"]
			margin 0 !important

/* .page-runtime pre::-webkit-scrollbar {
	display: none
} */
::-webkit-scrollbar {
	width: 8px !important;
	height: 8px !important;
	background: transparent;
	filter: invert();
}
::-webkit-scrollbar:hover {
	background: rgba(128, 128, 128, 0.2);
}
::-webkit-scrollbar-thumb {
	border: 1px solid rgba(255, 255, 255, 0.4) !important;
	background-color: rgba(0, 0, 0, 0.4) !important;
	z-index: 2147483647;
	-webkit-border-radius: 12px;
	background-clip: content-box;
}
::-webkit-scrollbar-corner {
	background: rgba(255, 255, 255, 0.3);
	border: 1px solid transparent;
}
::-webkit-scrollbar-thumb:hover {
	background-color: rgba(0, 0, 0, 0.8) !important;
}
::-webkit-scrollbar-thumb:active {
	background-color: rgba(0, 0, 0, 0.6) !important;
}
</style>
