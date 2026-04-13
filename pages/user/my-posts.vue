<template>
  <ProductList
    :type="'posts'"
    @load-more="handleLoadMore"
    @refresh="handleRefresh"
    ref="productList"
  />
</template>

<script>
import { request } from "@/utils/request.js";
export default {
  data() {
    return {
      List: [],
      userId: "",
    };
  },
  methods: {
    async fetchPosts() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          uni.showToast({
            title: "请先登录",
            icon: "none"
          });
          return [];
        }
        const res = await request({
          url: `/storeGood/user/${userInfo.userId}`,
          method: "GET",
        });
        if (res.code === 200) {
          // 处理商品状态显示
          return res.data.map(item => ({
            ...item,
            statusText: item.isShow === 0 ? '已下架' : '在售中',
            status: item.isShow === 0 ? 'sold' : 'on-sale'
          }));
        }
        return [];
      } catch (error) {
        console.error("获取商品数据失败:", error);
        uni.showToast({
          title: "获取商品失败",
          icon: "none"
        });
        return [];
      }
    },
    handleLoadMore(page) {
      // 由于后端接口没有分页，这里暂时不实现加载更多
      this.$refs.productList.setLoading(false);
      this.$refs.productList.setHasMore(false);
    },
    async handleRefresh() {
      try {
        const posts = await this.fetchPosts();
        this.$refs.productList.updateProducts(posts);
        this.$refs.productList.setPage(1);
        this.$refs.productList.setHasMore(false);
        uni.stopPullDownRefresh();
      } catch (error) {
        console.error("刷新数据失败:", error);
        uni.stopPullDownRefresh();
      }
    },
  },
  async mounted() {
    const posts = await this.fetchPosts();
    this.$refs.productList.updateProducts(posts);
  },
};
</script>