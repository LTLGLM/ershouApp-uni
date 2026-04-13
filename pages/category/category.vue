<template>
  <view class="category-container">
    <!-- 左侧一级分类 -->
    <scroll-view class="left-category" scroll-y>
      <view
        v-for="(item, index) in categories"
        :key="index"
        class="category-item"
        :class="{ active: activeIndex === index }"
        @click="changeCategory(index)"
      >
        {{ item.cateName }}
      </view>
    </scroll-view>

    <!-- 右侧子分类 -->
    <scroll-view class="right-subcategory" scroll-y>
      <view
        v-for="(subItem, subIndex) in subCategories"
        :key="subIndex"
        class="subcategory-item"
        @click="navigateToSearch(subItem)"
      >
        <image
          v-if="subItem.cateImage"
          :src="imgUrl + subItem.cateImage.replace(/\/dev-api/, '')"
          mode="aspectFit"
          class="subcategory-image"
        />
        <text class="subcategory-text">{{ subItem.cateName }}</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";
export default {
  data() {
    return {
      imgUrl: "http://localhost:8089",
      categories: [],
      activeIndex: 0,
      subCategories: [],
    };
  },
  onLoad() {
    // 获取分类数据
    this.getCategories();
  },
  methods: {
    async getCategories() {
      try {
        const res = await request({
          url: "/storeCate/tree",
          method: "GET",
        });
        if (res.code === 200) {
          this.categories = res.data;
          this.subCategories = this.categories[0].children;
        } else {
          uni.showToast({
            title: "获取分类数据失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.log(error);

        uni.showToast({
          title: "网络错误，请重试",
          icon: "none",
        });
      }
    },
    changeCategory(index) {
      this.activeIndex = index;
      this.subCategories = this.categories[index].children;
    },
    navigateToSearch(category) {
      uni.navigateTo({
        url: `/pages/search/search?categoryId=${category.cateId}&categoryName=${category.cateName}`,
      });
    },
  },
};
</script>

<style scoped>
.category-container {
  display: flex;
  height: 100vh;
}

.left-category {
  width: 30%;
  background-color: #f5f5f5;
}

.right-subcategory {
  width: 70%;
  padding: 20rpx;
}

.category-item {
  padding: 30rpx 20rpx;
  text-align: center;
  border-bottom: 1rpx solid #eee;
}

.category-item.active {
  background-color: #fff;
  color: #007aff;
  font-weight: bold;
}

.subcategory-item {
  display: inline-block;
  width: 48%;
  margin: 1%;
  padding: 20rpx;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 10rpx;
  box-sizing: border-box;
}

.subcategory-image {
  width: 100%;
  height: 120rpx;
  margin-bottom: 10rpx;
}

.subcategory-text {
  display: block;
  font-size: 24rpx;
}
</style>