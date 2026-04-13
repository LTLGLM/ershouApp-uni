<template>
  <view class="profile">
    <view class="user-card" v-if="isLoggedIn">
      <image
        :src="'http://localhost:8089' + (userInfo.avatarUrl || userInfo.avatar)"
        class="avatar"
      ></image>
      <view class="user-info">
        <text class="username">{{
          userInfo.nickname || userInfo.nickName || userInfo.username
        }}</text>
        <text class="school">{{ userInfo.school }}</text>
      </view>
    </view>
    <view class="user-card" v-else>
      <image src="/static/avatar/default.png" class="avatar"></image>
      <view class="user-info">
        <text class="username" @tap="goToLogin">立即登录</text>
      </view>
    </view>

    <view class="menu-list">
      <view
        class="menu-item"
        v-for="(item, index) in menuItems"
        :key="index"
        @tap="handleMenu(item)"
      >
        <view class="menu-content">
          <text class="iconfont" :class="item.icon"></text>
          <text class="menu-text">{{ item.text }}</text>
        </view>
        <text class="arrow">></text>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";

export default {
  data() {
    return {
      isLoggedIn: false,
      userInfo: {},
      menuItems: [
        {
          text: "我的发布",
          icon: "icon-publish",
          path: "/pages/user/my-posts",
        },
        {
          text: "我的收藏",
          icon: "icon-favorite",
          path: "/pages/user/favorites",
        },
        {
          text: "历史记录",
          icon: "icon-history",
          path: "/pages/user/history",
        },
        {
          text: "设置",
          icon: "icon-settings",
          path: "/pages/user/settings",
        },
        {
          text: "收货地址",
          icon: "icon-location",
          path: "/pages/user/address",
        },
        {
          text: "我的购买",
          icon: "icon-purchase",
          path: "/pages/user/purchases",
        },
        {
          text: "处理订单",
          icon: "icon-purchase",
          path: "/pages/user/process-orders",
        },
      ],
    };
  },
  onShow() {
    this.isLoggedIn = uni.getStorageSync("token") ? true : false;
    if (this.isLoggedIn) {
      this.getUserInfo();
    }
  },
  methods: {
    async getUserInfo() {
      try {
        const userInfo = uni.getStorageSync("userInfo");
        if (!userInfo || !userInfo.userId) {
          this.isLoggedIn = false;
          return;
        }

        const res = await request({
          url: `/storeUser/${userInfo.userId}`,
          method: "GET",
        });

        if (res.code === 200) {
          this.userInfo = res.data;
          // 更新本地存储的用户信息
          uni.setStorageSync("userInfo", res.data);
        } else {
          uni.showToast({
            title: res.message || "获取用户信息失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
        uni.showToast({
          title: "获取用户信息失败",
          icon: "none",
        });
      }
    },
    goToLogin() {
      uni.navigateTo({
        url: "/pages/login/login",
      });
    },
    handleMenu(item) {
      if (!this.isLoggedIn) {
        uni.showToast({
          title: "请先登录",
          icon: "none",
        });
        return this.goToLogin();
      }
      if (item.path) {
        uni.navigateTo({
          url: item.path,
        });
      }
    },
    logout() {
      uni.removeStorageSync("token");
      uni.removeStorageSync("userInfo");
      this.isLoggedIn = false;
      this.userInfo = {};
      uni.showToast({
        title: "已退出登录",
        icon: "success",
      });
      this.goToLogin();
    },
  },
};
</script>

<style>
.profile {
  background: #f8f8f8;
  min-height: 100vh;
}

.user-card {
  background: #fff;
  padding: 40rpx;
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 30rpx;
}

.user-info {
  flex: 1;
}

.username {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  color: #333;
}

.school {
  font-size: 28rpx;
  color: #666;
}

.menu-list {
  background: #fff;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.menu-content {
  display: flex;
  align-items: center;
}

.iconfont {
  margin-right: 20rpx;
  font-size: 40rpx;
  color: #666;
}

.menu-text {
  font-size: 32rpx;
  color: #333;
}

.arrow {
  color: #999;
  font-size: 32rpx;
}

.user-card[v-else] .username {
  color: #007aff;
}

.user-card[v-else] .school {
  color: #999;
}
</style>
