<template>
	<view style="height: 100vh">
		<view class="content">
			<u-search :show-action="true" actionText="搜索" placeholder="请输入商品名称" v-model="keyword" @search="handleSearch"
				@custom="handleSearch"></u-search>
			<!-- 分类栏 -->
			<u-tabs :list="categories" @click="handleCategoryClick">
				<view slot="right" style="padding-left: 4px" @tap="navigateToCategory">
					<u-icon name="list" size="21" bold></u-icon>
				</view>
			</u-tabs>
			<view>
				<!-- 轮播图 -->
				<u-swiper :list="carouselImages" :indicator="true" :autoplay="true" height="200"></u-swiper>

				<!-- 商品列表 -->
				<ProductList :enableScroll="false" ref="productList" />
			</view>
		</view>
	</view>
</template>

<script>
	import {
		request
	} from "@/utils/request.js"; // 导入封装的 request 方法
	export default {
		data() {
			return {
				keyword: "",
				categories: [],
				productList: [],
				carouselImages: [
					"/static/spider.png",
					"/static/spider.png",
					"/static/spider.png",
				],
			};
		},
		onShow() {
			this.loadGoodsList();
		},
		async mounted() {
			try {
				// 获取分类数据
				const cateRes = await request({
					url: "/storeCate/list",
					method: "GET",
				});
				if (cateRes.data) {
					this.categorys = cateRes.data;
					this.categories = cateRes.data.map((item) => {
						return {
							name: item.cateName,
						};
					});
				}
			} catch (error) {
				console.error("获取分类数据失败:", error);
			}
		},
		methods: {
			async loadGoodsList() {
				try {
					// 获取商品列表
					const goodsRes = await request({
						url: "/storeGood/search",
						method: "GET",
					});
					if (goodsRes.data) {
						this.productList = goodsRes.data.list;
						this.$nextTick(() => {
							this.$refs.productList.updateProducts(this.productList);
						});
					}
				} catch (error) {
					console.error("获取商品列表失败:", error);
				}
			},
			navigateToCategory() {
				uni.navigateTo({
					url: "/pages/category/category",
				});
			},
			async handleSearch() {
				if (!this.keyword) return;

				uni.navigateTo({
					url: `/pages/search/search?keyword=${this.keyword}`,
				});
			},
			handleCategoryClick(data) {
				const categoryId = this.categorys[data.index].cateId;
				const categoryName = this.categorys[data.index].cateName;
				uni.navigateTo({
					url: `/pages/search/search?categoryId=${categoryId}&categoryName=${categoryName}`,
				});
			},
		},
	};
</script>

<style scoped lang="scss">
	.content {
		padding-bottom: 100rpx; // 确保此值足够大，避免内容被TabBar遮挡
	}

	/deep/ .u-search {
		position: sticky;
		top: 0;
		left: 0;
		width: 100%;
		background-color: #fff;
		z-index: 999;
		padding: 10rpx;
		box-sizing: border-box;
	}

	/deep/ .u-scroll-list {
		width: 100%;
		overflow-x: auto;
		white-space: nowrap;
		padding: 0 0 !important;
	}

	.category {
		display: grid;
		grid-template-columns: 85% 15%;
		padding: 0 0 !important;
	}

	.category-all {
		align-self: center;
		text-align: center;
		font-size: 28rpx;
		color: #666;
		padding: 0 20rpx;
	}

	.category-item {
		padding: 10rpx 20rpx;
		text-align: center;
		line-height: 60rpx;
		display: inline-block;
		font-size: 28rpx;
	}

	.category-item:active {
		background-color: #f5f5f5;
		border-radius: 20rpx;
	}
</style>