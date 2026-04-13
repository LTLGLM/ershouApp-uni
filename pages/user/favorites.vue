<template>
  <ProductList
    :type="'favorites'"
    :showClearButton="true"
    buttonText="收藏"
    @load-more="handleLoadMore"
    @refresh="handleRefresh"
    @clear="handleClear"
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
    async fetchFavorites() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        const res = await request({
          url: `/storeUserCollect/${userInfo.userId}`,
          method: "GET",
        });
        if(!res.data){
          return [];
        }
        return res.data;
      } catch (error) {
        console.error("获取收藏数据失败:", error);
        return [];
      }
    },
    handleLoadMore(page) {
      setTimeout(() => {
        this.$refs.productList.setLoading(false);
        if (page > 3) {
          this.$refs.productList.setHasMore(false);
        }
      }, 1000);
    },
    async handleRefresh() {
      try {
        const favorites = await this.fetchFavorites();
        this.$refs.productList.updateProducts(favorites);
        this.$refs.productList.setPage(1);
        this.$refs.productList.setHasMore(true);
        uni.stopPullDownRefresh();
      } catch (error) {
        console.error("刷新数据失败:", error);
        uni.stopPullDownRefresh();
      }
    },
    async handleClear() {
      uni.showModal({
        title: '提示',
        content: '确定要清空收藏列表吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync("userInfo");
              const result = await request({
                url: `/storeUserCollect/${userInfo.userId}`,
                method: 'DELETE'
              });
              
              if (result.code === 200) {
                uni.showToast({
                  title: '清空成功',
                  icon: 'success'
                });
                this.$refs.productList.updateProducts([]);
                this.$refs.productList.setHasMore(false);
              } else {
                uni.showToast({
                  title: result.msg || '清空失败',
                  icon: 'none'
                });
              }
            } catch (error) {
              console.error('清空收藏失败:', error);
              uni.showToast({
                title: '清空失败',
                icon: 'none'
              });
            }
          }
        }
      })
    }
  },
  async mounted() {
    const favorites = await this.fetchFavorites();
    this.$refs.productList.updateProducts(favorites);
  },
};
</script>