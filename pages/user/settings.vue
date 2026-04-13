<template>
  <view class="settings-container">
    <u-cell-group>
      <u-cell title="个人信息" icon="account" @click="navigateTo('profile')"></u-cell>
      <u-cell title="退出登录" icon="close" @click="logout"></u-cell>
    </u-cell-group>
  </view>
</template>

<script>
import authMixin from "@/common/mixins/authMixin";
import { request } from "@/utils/request.js";
import { mapGetters, mapMutations } from "vuex";
export default {
  mixins: [authMixin],
  computed: {
    ...mapGetters(["websocketClient"]),
  },
  methods: {
    ...mapMutations(["SET_WEBSOCKET_CLIENT"]),
    navigateTo(page) {
      uni.navigateTo({
        url: `/pages/user/settings/${page}`,
      });
    },
    async logout() {
      try {
        await request({
          url: "/user/logout",
          method: "POST",
        });
        uni.showToast({
          title: "退出登录成功",
          icon: "success",
        });
        uni.removeStorageSync("token");
        uni.removeStorageSync("userInfo");
        // 断开websocket连接
        this.websocketClient.socketTask.close();
        this.SET_WEBSOCKET_CLIENT(null);
        uni.reLaunch({
          url: "/pages/my/my",
        });
      } catch (error) {
        console.error("退出登录失败:", error);
      }
    },
  },
};
</script>

<style>
.settings-container {
  padding: 20rpx;
}
</style>