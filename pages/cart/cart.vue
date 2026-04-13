<template>
  <view class="cart">
    <view class="cart-list">
      <view class="cart-item" v-for="(item, index) in cartItems" :key="index">
        <view class="checkbox">
          <checkbox
            :checked="item.checked === 1"
            @tap="toggleSelect(item)"
          ></checkbox>
        </view>
        <image
          :src="'http://localhost:8089' + item.image.replace(/\/dev-api/, '')"
          class="product-image"
          mode="aspectFill"
        ></image>
        <view class="product-info">
          <text class="title">{{ item.goodName }}</text>
          <text class="price">¥{{ item.price }}</text>
          <view class="quantity-control">
            <text class="minus" @tap="decreaseQuantity(item)">-</text>
            <text class="quantity">{{ item.addNum }}</text>
            <text class="plus" @tap="increaseQuantity(item)">+</text>
          </view>
        </view>
        <text class="delete" @tap="deleteItem(item)">×</text>
      </view>
    </view>

    <view class="cart-footer" v-if="cartItems.length > 0">
      <view class="select-all">
        <checkbox :checked="allSelected" @tap="toggleSelectAll"></checkbox>
        <text>全选</text>
      </view>
      <view class="total">
        <text>合计：</text>
        <text class="price">¥{{ formatPrice(totalPrice) }}</text>
      </view>
      <button class="checkout-btn" @tap="checkout">
        结算({{ selectedCount }})
      </button>
    </view>

    <view class="empty-cart" v-else>
      <text class="empty-text">购物车是空的</text>
      <button class="go-shopping" @tap="goShopping">去逛逛</button>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";
import authMixin from "@/common/mixins/authMixin.js";

export default {
  mixins: [authMixin],
  data() {
    return {
      cart: {},
      cartItems: [], // 购物车商品列表
    };
  },
  onShow() {
    this.loadCartItems();
  },
  computed: {
    allSelected() {
      return (
        this.cartItems.length > 0 &&
        this.cartItems.every((item) => item.checked === 1)
      );
    },
    selectedCount() {
      return this.cartItems.filter((item) => item.checked === 1).length;
    },
    totalPrice() {
      return this.cartItems
        .filter((item) => item.checked === 1)
        .reduce((total, item) => {
          // 确保价格和数量都转换为数字类型进行计算
          const price = parseFloat(item.price) || 0;
          const quantity = parseInt(item.addNum) || 0;
          return total + price * quantity;
        }, 0)
        .toFixed(2);
    },
  },
  methods: {
    // 加载购物车数据
    async loadCartItems() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo) {
          uni.showToast({
            title: "请先登录",
            icon: "none",
          });
          return;
        }
        const res = await request({
          url: `/storeCart/list?uid=${userInfo.userId}`,
          method: "GET",
        });
        if (res.code === 200) {
          this.cart = res.data;
          this.cartItems = res.data.storeCartGoodList || [];
        } else {
          uni.showToast({
            title: res.message,
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "加载购物车失败",
          icon: "none",
        });
      }
    },

    // 切换商品选中状态
    async toggleSelect(item) {
      try {
        const newChecked = item.checked === 1 ? 0 : 1;
        const res = await request({
          url: "/storeCart/update",
          method: "PUT",
          data: {
            id: item.cartInfoId,
            checked: newChecked,
          },
        });
        if (res.code === 200) {
          item.checked = newChecked;
        }
      } catch (error) {
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    // 全选/取消全选
    async toggleSelectAll() {
      const newState = !this.allSelected ? 1 : 0;
      try {
        request({
          url: "/storeCart/update/checkAll",
          method: "PUT",
          data: {
            checked: newState,
          },
        });
        this.cartItems.forEach((item) => (item.checked = newState));
      } catch (error) {
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    // 增加商品数量
    async increaseQuantity(item) {
      console.log(item);

      item.addNum++;
      const storeCartInfo = {
        id: item.cartInfoId,
        cartId: this.cart.id,
        ...item,
      };
      try {
        const res = await request({
          url: "/storeCart/update",
          method: "PUT",
          data: storeCartInfo,
        });
        if (res.code !== 200) {
          item.addNum--;
        }
      } catch (error) {
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    // 减少商品数量
    async decreaseQuantity(item) {
      if (item.addNum <= 1) return;
      item.addNum--;
      const storeCartInfo = {
        id: item.cartInfoId,
        cartId: this.cart.id,
        ...item,
      };
      try {
        const res = await request({
          url: "/storeCart/update",
          method: "PUT",
          data: storeCartInfo,
        });
        if (res.code !== 200) {
          item.addNum++;
        }
      } catch (error) {
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    // 删除商品
    deleteItem(item) {
      console.log(item);

      uni.showModal({
        title: "提示",
        content: "确定要删除这个商品吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const res = await request({
                url: `/storeCart/remove/${item.cartInfoId}`,
                method: "DELETE",
              });
              if (res.code === 200) {
                const index = this.cartItems.findIndex(
                  (i) => i.cartInfoId === item.cartInfoId
                );
                if (index > -1) {
                  this.cartItems.splice(index, 1);
                }
                uni.showToast({
                  title: "删除成功",
                  icon: "success",
                });
              }
            } catch (error) {
              uni.showToast({
                title: "删除失败",
                icon: "none",
              });
            }
          }
        },
      });
    },

    // 修改结算方法
    async checkout() {
      if (this.selectedCount === 0) {
        uni.showToast({
          title: "请选择要结算的商品",
          icon: "none"
        });
        return;
      }

      try {
        // 调用创建订单接口
        const res = await request({
          url: `/store-order/create/${this.cart.id}`,
          method: 'POST'
        });

        if (res.code === 200) {
          // 订单创建成功，获取订单号
          const orderId = res.data;
          
          // 跳转到订单页面
          uni.navigateTo({
            url: `/pages/order/order?orderId=${orderId}`
          });
        } else {
          uni.showToast({
            title: res.message || '创建订单失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('创建订单失败:', error);
        uni.showToast({
          title: '创建订单失败',
          icon: 'none'
        });
      }
    },

    // 去购物
    goShopping() {
      uni.switchTab({
        url: "/pages/index/index",
      });
    },

    formatPrice(price) {
      return parseFloat(price).toFixed(2);
    },
  },
};
</script>

<style>
.cart {
  min-height: 100vh;
  background: #f9f9f9;
  padding-bottom: 120rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  padding: 25rpx;
  background: #fff;
  margin-bottom: 25rpx;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.checkbox {
  margin-right: 25rpx;
}

.product-image {
  width: 180rpx;
  height: 180rpx;
  margin-right: 25rpx;
  border-radius: 12rpx;
}

.product-info {
  flex: 1;
}

.title {
  font-size: 32rpx;
  color: #222;
  margin-bottom: 12rpx;
}

.price {
  color: #ff4500;
  font-size: 36rpx;
  font-weight: bold;
}

.quantity-control {
  display: flex;
  align-items: center;
  margin-top: 25rpx;
}

.minus,
.plus {
  width: 70rpx;
  height: 70rpx;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  border-radius: 50%;
}

.quantity {
  width: 90rpx;
  text-align: center;
}

.delete {
  padding: 25rpx;
  color: #999;
  font-size: 45rpx;
}

.cart-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 120rpx;
  background: #fff;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  box-shadow: 0 -3rpx 15rpx rgba(0, 0, 0, 0.08);
}

.select-all {
  display: flex;
  align-items: center;
}

.total {
  flex: 1;
  text-align: right;
  margin-right: 30rpx;
}

.checkout-btn {
  background: #ff4500;
  color: #fff;
  padding: 0 50rpx;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  margin: 0;
  font-size: 34rpx;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 250rpx;
}

.empty-text {
  color: #999;
  font-size: 32rpx;
  margin-bottom: 50rpx;
}

.go-shopping {
  background: #ff4500;
  color: #fff;
  padding: 25rpx 70rpx;
  border-radius: 50rpx;
  font-size: 34rpx;
}
</style>
