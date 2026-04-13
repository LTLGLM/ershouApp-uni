<template>
  <ProductList
    :type="history"
    :showClearButton="true"
    buttonText="历史记录"
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
      userId: ""
    }
  },
  methods: {
    handleLoadMore(page) {
      // 模拟加载更多数据
      setTimeout(() => {
        this.$refs.productList.setLoading(false)
        if (page > 3) {
          this.$refs.productList.setHasMore(false)
        }
      }, 1000)
    },
    async fetchHistory() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        const res = await request({
          url: `/storeUserFootmark/${userInfo.userId}`,
          method: "GET",
        });
        if(!res.data){
          return [];
        }
        return res.data;
      } catch (error) {
        console.error("获取浏览历史失败:", error);
        return [];
      }
    },
    async handleRefresh() {
      try {
        const history = await this.fetchHistory();
        this.$refs.productList.updateProducts(history);
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
        content: '确定要清空浏览历史吗？',
        success: async (res) => {
          if (res.confirm) {
            try {
              const userInfo = uni.getStorageSync("userInfo");
              const result = await request({
                url: `/storeUserFootmark/${userInfo.userId}`,
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
              console.error('清空历史记录失败:', error);
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
    const history = await this.fetchHistory();
    this.$refs.productList.updateProducts(history);
  }
}
</script>