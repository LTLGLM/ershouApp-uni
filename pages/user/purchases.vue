<template>
  <view class="container">
    <view v-if="purchaseList.length > 0" class="order-list">
      <view
        v-for="(item, index) in purchaseList"
        :key="index"
        class="order-item"
      >
        <!-- 订单基本信息 -->
        <view class="order-basic" @click="toggleOrderDetail(index)">
          <view class="order-info">
            <text class="order-time">{{ item.createTime }}</text>
            <text :class="['order-status', getStatusClass(item.status)]">{{
              getStatusText(item.status)
            }}</text>
          </view>
          <view class="order-amount">
            <text
              >实付款：<text class="total-price"
                >¥{{ item.totalPrice }}</text
              ></text
            >
            <text class="arrow-icon" :class="{ 'arrow-up': item.showDetail }"
              >▼</text
            >
          </view>
        </view>

        <!-- 订单详情（可展开） -->
        <view class="order-detail" v-if="item.showDetail">
          <!-- 商品列表 -->
          <view class="product-list">
            <view
              v-for="product in item.products"
              :key="product.id"
              class="product-item"
            >
              <image
                class="product-image"
                :src="'http://localhost:8089/' + product.image"
                mode="aspectFill"
              ></image>
              <view class="product-info">
                <view class="product-name">{{ product.name }}</view>
                <view class="product-details">
                  <text class="product-price">¥{{ product.price }}</text>
                  <text class="product-quantity"
                    >跑腿费¥{{ product.deliveryFee || 0 }} x{{
                      product.quantity
                    }}</text
                  >
                </view>
              </view>
            </view>
          </view>

          <!-- 订单地址信息 -->
          <view class="order-address">
            <view class="address-title">收货地址</view>
            <view class="address-content">
              <view class="address-info">
                <text class="address-name">{{ item.addressInfo.name }}</text>
                <text class="address-phone">{{ item.addressInfo.tel }}</text>
              </view>
              <view class="address-detail">
                {{ item.addressInfo.campusName }} {{ item.addressInfo.floorName }} {{ item.addressInfo.addressDetail }}
              </view>
            </view>
          </view>

          <!-- 订单底部 -->
          <view class="order-footer">
            <view class="order-total">
              <text>共{{ getTotalQuantity(item.products) }}件商品</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 无数据提示 -->
    <view v-else class="empty-state">
      <image src="/static/empty.png" mode="aspectFit" class="empty-image"></image>
      <text class="empty-text">暂无订单数据</text>
      <button class="back-btn" @tap="goBack">返回上一级</button>
    </view>

    <!-- 加载更多 -->
    <uni-load-more
      v-if="purchaseList.length > 0"
      :status="loadingStatus"
      @clickLoadMore="loadMore"
    ></uni-load-more>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";

export default {
  data() {
    return {
      purchaseList: [],
      page: 1,
      pageSize: 10,
      loadingStatus: "more",
      hasMore: true,
      isLoading: false,
      userInfo: null,
    };
  },
  onLoad() {
    // 获取用户信息
    this.userInfo = uni.getStorageSync("userInfo");
    // 获取订单列表
    this.getPurchaseList();
  },
  onPullDownRefresh() {
    this.page = 1;
    this.hasMore = true;
    this.getPurchaseList();
  },
  onReachBottom() {
    if (this.hasMore && !this.isLoading) {
      this.loadMore();
    }
  },
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    // 格式化时间
    formatTime(time) {
      const date = new Date(time);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    },
    toggleOrderDetail(index) {
      this.purchaseList[index].showDetail =
        !this.purchaseList[index].showDetail;
    },
    getTotalQuantity(products) {
      return products.reduce((total, product) => total + product.quantity, 0);
    },
    getStatusText(status) {
      const statusMap = {
        2: "已完成",
        3: "已取消",
      };
      return statusMap[status] || "";
    },
    getStatusClass(status) {
      return `status-${status}`;
    },
    async getPurchaseList() {
      if (this.isLoading) return;
      this.isLoading = true;
      try {
        const res = await request({
          url: `/store-order/completed/${this.userInfo.userId}`,
          method: "GET",
        });

        if (res.code === 200) {
          const orderList = res.data || [];
          if (this.page === 1) {
            this.purchaseList = orderList.map((item) => ({
              id: item.orderId,
              createTime: this.formatTime(item.createTime),
              totalPrice: item.totalPrice,
              status: item.orderStatus,
              showDetail: false,
              products: [
                {
                  id: item.goodInfo.goodId,
                  name: item.goodInfo.goodName,
                  price: item.goodInfo.price,
                  quantity: item.goodInfo.quantity,
                  deliveryFee: item.freightPrice,
                  image: item.goodInfo.goodImage,
                },
              ],
              addressInfo: {
                name: item.addressInfo.name,
                tel: item.addressInfo.phone,
                campusName: item.addressInfo.campusName,
                floorName: item.addressInfo.floorName,
                addressDetail: item.addressInfo.addressDetail
              },
            }));
            uni.stopPullDownRefresh();
          } else {
            const newItems = orderList.map((item) => ({
              id: item.orderId,
              createTime: this.formatTime(item.createTime),
              totalPrice: item.totalPrice,
              status: item.orderStatus,
              showDetail: false,
              products: [
                {
                  id: item.goodInfo.goodId,
                  name: item.goodInfo.goodName,
                  price: item.goodInfo.price,
                  quantity: item.goodInfo.quantity,
                  deliveryFee: item.freightPrice,
                  image: item.goodInfo.goodImage,
                },
              ],
              addressInfo: {
                name: item.addressInfo.name,
                tel: item.addressInfo.phone,
                campusName: item.addressInfo.campusName,
                floorName: item.addressInfo.floorName,
                addressDetail: item.addressInfo.addressDetail
              },
            }));
            this.purchaseList = [...this.purchaseList, ...newItems];
          }

          this.hasMore = orderList.length === this.pageSize;
          this.loadingStatus = this.hasMore ? "more" : "noMore";
        } else {
          uni.showToast({
            title: res.msg || "获取订单失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error(error);
        uni.showToast({
          title: "获取订单失败",
          icon: "none",
        });
      } finally {
        this.isLoading = false;
      }
    },
    loadMore() {
      if (this.hasMore) {
        this.page++;
        this.loadingStatus = "loading";
        this.getPurchaseList();
      }
    },
  },
};
</script>

<style>
.container {
  padding: 20rpx;
  background-color: #f7f7f7;
  min-height: 100vh;
}

.order-list {
  margin-bottom: 20rpx;
}

.order-item {
  background-color: #fff;
  border-radius: 12rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.order-basic {
  padding: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.order-status {
  font-size: 24rpx;
}

.order-amount {
  display: flex;
  align-items: center;
}

.total-price {
  color: #ff5500;
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.arrow-icon {
  font-size: 24rpx;
  color: #999;
  transition: transform 0.3s;
}

.arrow-up {
  transform: rotate(180deg);
}

.status-2 {
  color: #19be6b;
}
.status-3 {
  color: #999;
}

.order-detail {
  border-top: 1rpx solid #f5f5f5;
}

.order-address {
  padding: 20rpx;
  background-color: #f9f9f9;
  margin: 20rpx;
  border-radius: 8rpx;
}

.address-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.address-content {
  font-size: 26rpx;
}

.address-info {
  margin-bottom: 10rpx;
}

.address-name {
  margin-right: 20rpx;
  font-weight: bold;
}

.address-phone {
  color: #666;
}

.address-detail {
  color: #333;
  line-height: 1.5;
}

.product-list {
  padding: 20rpx;
}

.product-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 160rpx;
  height: 160rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.product-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  color: #ff5500;
  font-size: 32rpx;
  font-weight: bold;
}

.product-quantity {
  color: #999;
  font-size: 24rpx;
  margin-left: 10rpx;
}

.order-footer {
  padding: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20rpx;
  font-size: 24rpx;
  color: #666;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
}

.empty-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 30rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.back-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: #ff5500;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  margin: 0;
}
</style>
