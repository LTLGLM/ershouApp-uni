<template>
  <view class="product-list">
    <scroll-view
      :scroll-y="enableScroll"
      class="scroll-view"
      @scrolltolower="loadMore"
      refresher-enabled
      @refresherrefresh="refresh"
    >
      <view class="product-grid">
        <view
          class="product-card"
          v-for="(item, index) in products"
          :key="index"
          @tap="viewProduct(item)"
        >
          <!-- 售罄遮罩层 -->
          <view class="sold-out-mask" v-if="item.stock === 0">
            <text>已售罄</text>
          </view>
          <image
            :src="imgUrl + item.image.replace(/\/dev-api/, '')"
            mode="aspectFill"
            class="product-image"
          ></image>
          <view class="product-info">
            <text class="product-title">{{ item.goodName }}</text>
            <view class="product-meta">
              <text class="product-price">¥{{ item.price }}</text>
              <text
                v-if="type === 'posts'"
                class="product-status"
                :class="item.status"
                >{{ item.statusText }}</text
              >
              <text v-else-if="type === 'favorites'" class="favorite-time">{{
                item.time
              }}</text>
              <text v-else-if="type === 'history'" class="view-time">{{
                item.viewTime
              }}</text>
            </view>
            <view v-if="type === 'posts'" class="product-stats">
              <text>浏览 {{ item.browse }}</text>
              <text>收藏 {{ item.collectCount }}</text>
            </view>
            <view v-if="type === 'posts'" class="product-actions">
              <template v-if="item.stock > 0">
                <button
                  class="action-btn"
                  :class="item.isShow ? 'off-sale' : 'on-sale'"
                  @tap.stop="toggleStatus(item)"
                >
                  {{ item.isShow ? '下架' : '上架' }}
                </button>
                <button
                  class="action-btn delete"
                  @tap.stop="deleteProduct(item)"
                >
                  删除
                </button>
              </template>
              <template v-else>
                <button
                  class="action-btn delete"
                  @tap.stop="deleteProduct(item)"
                >
                  删除
                </button>
              </template>
            </view>
          </view>
        </view>
      </view>

      <view class="loading" v-if="loading">加载中...</view>
      <view class="no-more" v-if="!hasMore">没有更多了</view>
    </scroll-view>

    <view v-if="showClearButton" class="clear-button" @tap="clearList">
      <text>清空{{ buttonText }}</text>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";
export default {
  name: "ProductList",
  props: {
    type: {
      type: String,
      required: true,
      default: "default",
      validator: (value) =>
        ["default", "posts", "favorites", "history"].includes(value),
    },
    showClearButton: {
      type: Boolean,
      default: false,
    },
    buttonText: {
      type: String,
      default: "历史记录",
    },
    enableScroll: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      imgUrl: "http://localhost:8089",
      products: [],
      loading: false,
      hasMore: true,
      page: 1,
    };
  },
  methods: {
    loadMore() {
      if (this.loading || !this.hasMore) return;
      this.loading = true;
      this.$emit("load-more", this.page + 1);
    },
    refresh() {
      this.page = 1;
      this.$emit("refresh");
    },
    viewProduct(product) {
      uni.navigateTo({
        url: `/pages/product/product?id=${product.goodId}&soldOut=${
          product.stock === 0
        }`,
      });
    },
    clearList() {
      this.$emit("clear");
    },
    updateProducts(products) {
      if (products.length === 0) {
        uni.showToast({
          title: "暂无数据",
          icon: "none",
        });
        setTimeout(() => {
          uni.navigateBack();
        }, 1000);
      }
      this.products = products;
    },
    setLoading(status) {
      this.loading = status;
    },
    setHasMore(status) {
      this.hasMore = status;
    },
    setPage(page) {
      this.page = page;
    },
    async toggleStatus(product) {
      try {
        const res = await request({
          url: "/storeGood/isShow",
          method: "PUT",
          data: {
            goodId: product.goodId,
            isShow: !product.isShow
          }
        });
        
        if (res.code === 200) {
          uni.showToast({
            title: product.isShow ? '下架成功' : '上架成功',
            icon: 'success'
          });
          // 更新本地数据
          product.isShow = !product.isShow;
          product.statusText = product.isShow ? '在售中' : '已下架';
          product.status = product.isShow ? 'on-sale' : 'sold';
        } else {
          uni.showToast({
            title: res.msg || '操作失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('切换商品状态失败:', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },

    async deleteProduct(product) {
      uni.showModal({
        title: "提示",
        content: "确定要删除该商品吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await request({
                url: `/storeGood/${product.goodId}`,
                method: "DELETE",
              });

              if (result.code === 200) {
                uni.showToast({
                  title: "删除成功",
                  icon: "success",
                });
                // 从列表中移除该商品
                this.products = this.products.filter(
                  (item) => item.goodId !== product.goodId
                );
              } else {
                uni.showToast({
                  title: result.msg || "删除失败",
                  icon: "none",
                });
              }
            } catch (error) {
              console.error("删除商品失败:", error);
              uni.showToast({
                title: "删除失败",
                icon: "none",
              });
            }
          }
        },
      });
    },
  },
};
</script>

<style>
.product-list {
  /* height: 100vh; */
  background: #fff;
  position: relative;
}

.product-grid {
  padding: 20rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.product-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 10rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.sold-out-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
}

.sold-out-mask text {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
  padding: 10rpx 30rpx;
  border: 2rpx solid #ff6b6b;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.9);
}

.product-image {
  width: 100%;
  height: 345rpx;
}

.product-info {
  padding: 16rpx;
}

.product-title {
  font-size: 28rpx;
  color: #333;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12rpx;
}

.product-price {
  color: #ff6b6b;
  font-size: 32rpx;
  font-weight: bold;
}

.product-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

.product-status.on-sale {
  color: #67c23a;
  background: #f0f9eb;
}

.product-status.sold {
  color: #909399;
  background: #f4f4f5;
}

.product-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #999;
}

.favorite-time,
.view-time {
  font-size: 24rpx;
  color: #999;
}

.seller-info {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
}

.seller-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 8rpx;
}

.seller-name {
  font-size: 24rpx;
  color: #666;
}

.loading,
.no-more {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 24rpx;
}

.clear-button {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #ff6b6b;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.product-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #f5f5f5;
  position: relative;
  z-index: 2;
}

.action-btn {
  flex: 1;
  height: 60rpx;
  line-height: 60rpx;
  text-align: center;
  font-size: 24rpx;
  border-radius: 30rpx;
  margin: 0 10rpx;
  background: #f5f5f5;
  color: #666;
  position: relative;
  z-index: 2;
}

.action-btn.on-sale {
  background: #67c23a;
  color: #fff;
}

.action-btn.off-sale {
  background: #909399;
  color: #fff;
}

.action-btn.delete {
  background: #ff6b6b;
  color: #fff;
}

/* 已售罄商品的操作按钮样式 */
.sold-out-mask + .product-info .product-actions .action-btn.delete {
  width: 100%;
  margin: 0;
  z-index: 2;
}
</style>
