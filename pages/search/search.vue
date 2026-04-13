<template>
  <view class="search-container">
    <u-search
      :show-action="true"
      actionText="搜索"
      placeholder="请输入商品名称"
      v-model="keyword"
      @search="handleSearch"
      @custom="handleSearch"
    ></u-search>
    <view class="category-title" v-if="categoryName">
      当前分类：{{ categoryName }}
    </view>
    <ProductList :enableScroll="true" ref="productList" />
  </view>
</template>

<script>
import { request } from "@/utils/request.js";
import ProductList from "@/components/ProductList.vue";

export default {
  components: { ProductList },
  data() {
    return {
      keyword: "",
      categoryId: "",
      categoryName: "",
    };
  },
  onLoad(options) {
    console.log(options);

    if (options.keyword) {
      this.keyword = options.keyword;
      this.handleSearch();
    } else if (options.categoryId) {
      this.categoryId = options.categoryId;
      this.categoryName = options.categoryName || '';
      this.handleSearch();
    }
  },
  methods: {
    async handleSearch() {
      if (!this.keyword && !this.categoryId) return;

      uni.showLoading({ title: "加载中..." });
      try {
        let res;
        if (this.keyword) {
          res = await request({
            url: "/storeGood/search",
            method: "GET",
            data: { goodName: this.keyword },
          });
          if(res.data.list.length===0){
            uni.showToast({ title: "未找到相关商品", icon: "none" });
          }
        } else {
          res = await request({
            url: `/storeCate/${this.categoryId}`,
            method: "GET",
          });
          if(res.data.length===0){
            uni.showToast({ title: "未找到相关商品", icon: "none" });
          }
        }
        this.$refs.productList.updateProducts(res.data.list || res.data);
      } catch (e) {
        uni.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        uni.hideLoading();
      }
    },
  },
};
</script>

<style scoped lang="scss">
.search-container {
  padding: 20rpx;
}

.category-title {
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
}
</style>