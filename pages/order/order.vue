<template>
  <view class="order">
    <!-- 自定义导航栏 -->
    <view class="custom-nav">
      <view class="nav-left" @tap="handleBackPress">
        <u-icon name="arrow-left" size="40"></u-icon>
      </view>
      <view class="nav-title">确认订单</view>
    </view>

    <!-- 收货地址选择 -->
    <view class="address-section" @tap="chooseAddress">
      <view v-if="selectedAddress" class="address-info">
        <view class="user-info">
          <text class="name">{{ selectedAddress.name }}</text>
          <text class="phone">{{ selectedAddress.phone }}</text>
        </view>
        <view class="address-detail">
          {{ selectedAddress.province }}{{ selectedAddress.city
          }}{{ selectedAddress.district }}{{ selectedAddress.detailAddress }}
        </view>
      </view>
      <view v-else class="no-address">
        <text>请选择收货地址</text>
        <u-icon name="arrow-right" size="30"></u-icon>
      </view>
    </view>

    <!-- 分割线 -->
    <view class="divider"></view>

    <!-- 倒计时 -->
    <!-- <view class="countdown">
      <text class="countdown-text">请在</text>
      <text class="countdown-time">{{ formatTime(countdown) }}</text>
      <text class="countdown-text">内完成支付</text>
    </view> -->

    <!-- 商品列表 -->
    <view class="product-list">
      <view class="product-item" v-for="(item, index) in products" :key="index">
        <image
          :src="'http://localhost:8089/' + item.image"
          class="product-image"
          mode="aspectFill"
        ></image>
        <view class="product-info">
          <text class="product-title">{{ item.title }}</text>
          <view class="price-row">
            <text class="product-price">¥{{ item.price }}</text>
            <text class="delivery-fee">跑腿费：¥{{ item.deliveryFee }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 费用明细 -->
    <view class="cost-detail">
      <view class="cost-item">
        <text>商品总价</text>
        <text>¥{{ totalProductPrice }}</text>
      </view>
      <view class="cost-item">
        <text>总跑腿费</text>
        <text>¥{{ totalDeliveryFee }}</text>
      </view>
      <view class="divider"></view>
      <view class="cost-item total">
        <text>实付金额</text>
        <text class="total-price">¥{{ totalAmount }}</text>
      </view>
    </view>

    <!-- 底部支付按钮 -->
    <view class="bottom-bar" v-if="!paid && orderStatus !== 3">
      <view class="total-amount">
        <text>合计：</text>
        <text class="price">¥{{ totalAmount }}</text>
      </view>
      <button class="pay-btn" @tap="pay">立即支付</button>
    </view>

    <!-- 订单状态显示 -->
    <view class="order-status" v-else>
      <view class="status-text" :class="statusClass">
        {{ statusText }}
      </view>
      <view class="status-info" v-if="paid">
        <text>支付时间：{{ payTime }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";

export default {
  data() {
    return {
      selectedAddress: null,
      userInfo: null,
      countdown: 30 * 60, // 30分钟倒计时（秒）
      products: [
        {
          id: 1,
          title: "九成新iPhone 12 128G",
          price: 3999,
          deliveryFee: 5,
          image: "/static/products/iphone.png",
        },
      ],
      timer: null,
      orderId: "", // 订单ID
      orderStatus: "",
      paid: false,
      cartId: "", // 购物车ID
    };
  },
  computed: {
    totalProductPrice() {
      return this.products.reduce((sum, item) => sum + item.price, 0);
    },
    totalDeliveryFee() {
      return this.products.reduce((sum, item) => sum + item.deliveryFee, 0);
    },
    totalAmount() {
      return this.totalProductPrice + this.totalDeliveryFee;
    },
    statusText() {
      if (this.paid) {
        return "订单已支付";
      } else if (this.orderStatus === 3) {
        return "订单已取消";
      }
      return "";
    },
    statusClass() {
      return {
        paid: this.paid,
        canceled: this.orderStatus === 3,
      };
    },
    payTime() {
      // 格式化支付时间
      if (this.orderData && this.orderData.payTime) {
        const date = new Date(this.orderData.payTime);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(date.getDate()).padStart(2, "0")} ${String(
          date.getHours()
        ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
      }
      return "";
    },
  },
  async onLoad(options) {
    // 设置自定义导航栏
    uni.setNavigationBarColor({
      frontColor: "#000000",
      backgroundColor: "#ffffff",
    });

    if (options.orderId) {
      this.orderId = options.orderId;
      this.loadOrderInfo();
    }

    // 获取用户信息
    this.userInfo = uni.getStorageSync("userInfo");

    // 如果用户已登录，获取默认地址
    if (this.userInfo) {
      await this.getDefaultAddress();
    }

    // 启动倒计时
    this.startCountdown();

    // 解析商品数据
    if (options.products) {
      try {
        this.products = JSON.parse(decodeURIComponent(options.products));
      } catch (e) {
        console.error("解析商品数据失败:", e);
      }
    }
  },
  onUnload() {
    // 清除定时器
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  methods: {
    // 获取默认地址
    async getDefaultAddress() {
      try {
        const res = await request({
          url: `/storeAddress/defaultAddress/${this.userInfo.userId}`,
          method: "GET",
        });

        if (res.code === 200 && res.data) {
          // 如果有默认地址数据，直接设置
          this.selectedAddress = {
            name: res.data.name,
            phone: res.data.tel,
            addressId: res.data.addressId,
            // 组合完整地址
            province: "",
            city: "",
            district: res.data.campusName,
            detailAddress: `${res.data.floorName} ${res.data.addressDetail}`,
          };
        }
      } catch (error) {
        console.error("获取默认地址失败:", error);
        // 获取失败时不做处理，让用户手动选择地址
      }
    },
    startCountdown() {
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
          // 订单超时处理
          uni.showModal({
            title: "提示",
            content: "订单已超时，请重新下单",
            showCancel: false,
            success: () => {
              uni.navigateBack();
            },
          });
        }
      }, 1000);
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    chooseAddress() {
      uni.navigateTo({
        url: "/pages/user/address?type=select",
        events: {
          addressSelected: (address) => {
            this.selectedAddress = {
              name: address.name,
              phone: address.tel,
              addressId: address.addressId,
              // 组合完整地址
              province: "",
              city: "",
              district: address.campusName,
              detailAddress: `${address.floorName} ${address.addressDetail}`,
            };
          },
        },
      });
    },
    async pay() {
      if (!this.selectedAddress) {
        uni.showToast({
          title: "请选择收货地址",
          icon: "none",
        });
        return;
      }

      try {
        uni.showLoading({
          title: "支付中...",
        });

        const res = await request({
          url: `/store-order/pay/${this.orderId}`,
          method: "POST",
          data: {
            addressId: this.selectedAddress.addressId
          }
        });

        uni.hideLoading();

        if (res.code === 200) {
          // 支付成功
          uni.showToast({
            title: "支付成功",
            icon: "success",
            duration: 2000,
          });

          // 清除倒计时
          if (this.timer) {
            clearInterval(this.timer);
          }
          // 延迟跳转到订单列表页
          setTimeout(() => {
            uni.redirectTo({
              url: "/pages/user/process-orders",
            });
          }, 2000);
        } else {
          uni.showToast({
            title: res.msg || "支付失败",
            icon: "none",
          });
        }
      } catch (error) {
        uni.hideLoading();
        console.error("支付失败:", error);
        uni.showToast({
          title: "支付失败，请重试",
          icon: "none",
        });
      }
    },
    // 加载订单信息
    async loadOrderInfo() {
      try {
        const res = await request({
          url: `/store-order/${this.orderId}`,
          method: "GET",
        });

        if (res.code === 200) {
          const orderData = res.data;
          // 设置商品信息
          this.products = orderData.goodsList.map((good) => ({
            id: good.goodId,
            title: good.goodName,
            price: good.price,
            deliveryFee: good.freightPrice,
            image: good.goodImage,
            quantity: good.quantity,
          }));

          // 设置地址信息
          if (orderData.addressInfo) {
            this.selectedAddress = {
              name: orderData.addressInfo.name,
              phone: orderData.addressInfo.phone,
              addressId: orderData.addressInfo.addressId,
              province: "",
              city: "",
              district: orderData.addressInfo.addressDetail,
              detailAddress: orderData.addressInfo.addressDetail,
            };
          }

          // 设置订单状态
          this.orderStatus = orderData.orderStatus;
          this.paid = orderData.paid === 1;

          // 如果订单已支付或已取消，清除倒计时并隐藏支付按钮
          if (this.paid || this.orderStatus === 3) {
            if (this.timer) {
              clearInterval(this.timer);
            }
          }
        } else {
          uni.showToast({
            title: res.msg || "加载订单信息失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("加载订单信息失败:", error);
        uni.showToast({
          title: "加载订单信息失败",
          icon: "none",
        });
      }
    },
    // 创建订单
    async createOrder() {
      if (!this.selectedAddress) {
        uni.showToast({
          title: "请选择收货地址",
          icon: "none",
        });
        return;
      }

      try {
        const res = await request({
          url: `/store-order/create/${this.cartId}`,
          method: "POST",
          data: {
            addressId: this.selectedAddress.addressId
          }
        });

        if (res.code === 200) {
          this.orderId = res.data;
          // 跳转到支付页面
          uni.navigateTo({
            url: `/pages/payment/payment?orderId=${this.orderId}&amount=${this.totalAmount}`,
          });
        } else {
          uni.showToast({
            title: res.msg || "创建订单失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("创建订单失败:", error);
        uni.showToast({
          title: "创建订单失败",
          icon: "none",
        });
      }
    },
    // 取消订单
    async cancelOrder() {
      if (this.orderId) {
        try {
          const res = await request({
            url: `/store-order/cancel/${this.orderId}`,
            method: "POST",
          });

          if (res.code === 200) {
            uni.showToast({
              title: "订单已取消",
              icon: "success",
            });
            // 清除定时器
            if (this.timer) {
              clearInterval(this.timer);
            }
            // 返回上一页
            setTimeout(() => {
              uni.navigateBack();
            }, 1500);
          } else {
            uni.showToast({
              title: res.msg || "取消订单失败",
              icon: "none",
            });
          }
        } catch (error) {
          console.error("取消订单失败:", error);
          uni.showToast({
            title: "取消订单失败",
            icon: "none",
          });
        }
      } else {
        // 如果没有orderId，直接返回
        uni.navigateBack();
      }
    },
    // 处理返回按钮点击
    handleBackPress() {
      uni.showModal({
        title: "提示",
        content: "返回将取消订单，是否确认返回？",
        success: (res) => {
          if (res.confirm) {
            this.cancelOrder();
          }
        },
      });
    },
  },
};
</script>

<style>
/* 添加自定义导航栏样式 */
.custom-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background: #fff;
  display: flex;
  align-items: center;
  padding-top: var(--status-bar-height);
  z-index: 999;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.nav-left {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
}

/* 修改原有样式以适应自定义导航栏 */
.order {
  padding-top: calc(44px + var(--status-bar-height));
  min-height: 100vh;
  background: #f8f8f8;
  padding-bottom: 120rpx;
}

.address-section {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.address-info {
  position: relative;
}

.user-info {
  margin-bottom: 10rpx;
}

.name {
  font-size: 32rpx;
  font-weight: bold;
  margin-right: 20rpx;
}

.phone {
  font-size: 28rpx;
  color: #666;
}

.address-detail {
  font-size: 28rpx;
  color: #333;
  line-height: 1.4;
}

.no-address {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 30rpx;
  color: #666;
}

.divider {
  height: 20rpx;
  background: #f8f8f8;
}

.countdown {
  background: #fff;
  padding: 20rpx;
  text-align: center;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.countdown-text {
  font-size: 28rpx;
  color: #333;
}

.countdown-time {
  color: #ff4444;
  font-size: 32rpx;
  font-weight: bold;
  margin: 0 10rpx;
}

.product-list {
  background: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
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
}

.product-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 32rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.delivery-fee {
  font-size: 24rpx;
  color: #666;
}

.cost-detail {
  background: #fff;
  padding: 20rpx;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  padding: 10rpx 0;
  font-size: 28rpx;
  color: #666;
}

.divider {
  height: 1rpx;
  background: #f5f5f5;
  margin: 20rpx 0;
}

.total {
  font-size: 32rpx;
  color: #333;
}

.total-price {
  color: #ff6b6b;
  font-weight: bold;
}

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.total-amount {
  flex: 1;
  font-size: 28rpx;
}

.total-amount .price {
  color: #ff6b6b;
  font-size: 36rpx;
  font-weight: bold;
}

.pay-btn {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  background: #ff6b6b;
  color: #fff;
  border-radius: 40rpx;
  font-size: 32rpx;
  margin: 0;
}

.order-status {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx;
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  text-align: center;
}

.status-text {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.status-text.paid {
  color: #07c160;
}

.status-text.canceled {
  color: #999;
}

.status-info {
  font-size: 24rpx;
  color: #666;
}
</style>
