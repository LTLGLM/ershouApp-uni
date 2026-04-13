<template>
  <view class="login-container">
    <view class="login-box">
      <view v-if="!showForm">
        <button
          class="wechat-login-btn"
          open-type="getUserInfo"
          @getuserinfo="onGetUserInfo"
          @tap="handleWechatLogin"
        >
          <view class="btn-content">
            <image src="/static/wechat-logo.png" class="wechat-icon"></image>
            <text>微信授权一键登录</text>
            <!-- 修改按钮文字 -->
          </view>
        </button>
        <!-- 新增暂不登录文本 -->
        <view class="skip-login" @click="handleSkipLogin">
          <text>暂不登录</text>
        </view>
      </view>
      <!-- 新增表单 -->
      <view v-if="showForm">
        <view class="form-item">
          <text>用户昵称</text>
          <input v-model="nickname" placeholder="请输入昵称" />
        </view>
        <view class="form-item">
          <text>性别</text>
          <picker v-model="gender" :range="genders">
            <view class="picker">
              {{ genders[gender] }}
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text>生日</text>
          <picker
            mode="date"
            :value="birthday"
            @change="handleBirthdayChange"
            start="1900-01-01"
            end="2100-12-31"
          >
            <view class="picker">
              {{ birthday || '请选择生日' }}
            </view>
          </picker>
        </view>
        <view class="form-item">
          <text>用户手机号</text>
          <input v-model="phone" placeholder="请输入手机号" />
        </view>
        <view class="form-item">
          <text>用户头像</text>
          <button @click="chooseAvatar">选择头像</button>
          <image v-if="avatar" :src="avatar" mode="aspectFit" />
        </view>
        <button @click="submitForm">提交</button>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js"; // 导入封装的 request 方法
import { mergeWith } from "lodash"; // 引入lodash的mergeWith方法

export default {
  data() {
    return {
      showForm: false,
      nickname: "",
      gender: 0,
      genders: ["男", "女"],
      birthday: "2000-01-01", // 设置默认生日
      phone: "",
      avatar: "",
      loginRes: "",
    };
  },
  methods: {
    async handleWechatLogin() {
      try {
        // 1. 获取微信登录code
        const loginRes = await uni.login({
          provider: "weixin",
        });

        // 2. 将code发送到自己的服务器换取openid和session_key
        const res = await request({
          url: "/user/login",
          method: "POST",
          data: {
            code: loginRes.code,
          },
        });

        if (res.data.status !== "login") {
          // 显示表单
          this.showForm = true;
          this.loginRes = res.data.token;
          this.loginUserInfo = res.data.user
          return;
        } else {
          // 登录
          // 存储 token 和用户信息到本地存储
          if (res.data) {
            console.log("res", res.data);
            uni.setStorageSync("token", res.data.token);
            let userInfo = uni.getStorageSync("userInfo"); // 获取现有的userInfo
            console.log(userInfo);
            // Object.assign(userInfo, res.data.user); // 注释掉原有的Object.assign方法
            userInfo = mergeWith(userInfo, res.data.user, this.customize); // 使用mergeWith方法合并对象
            console.log("userInfo", userInfo);

            uni.setStorageSync("userInfo", userInfo);
          }

          // 提交成功后跳转
          uni.showToast({
            title: "登录成功",
            icon: "success",
            duration: 2000,
          });

          const pages = getCurrentPages();
          if (pages.length >= 2) {
            const prevPage = pages[pages.length - 2];
            prevPage.onLoad(); // 触发上一页的数据刷新
          }
          uni.navigateBack();
        }
      } catch (error) {
        console.error("登录失败:", error);
        uni.showToast({
          title: "登录失败",
          icon: "none",
        });
      }
    },

    onGetUserInfo(e) {
      const userInfo = e.detail.userInfo;
      if (userInfo) {
        const userInfos = {
          nickName: userInfo.nickName, // 用户昵称
          avatar: userInfo.avatarUrl, // 用户头像
          gender: userInfo.gender, // 用户性别，0：未知、1：男、2：女
        };
        // 处理用户信息，存储到vuex或本地存储
        uni.setStorageSync("userInfo", userInfos);
      }
    },
    customize(objValue, srcValue) {
      if (srcValue === null || srcValue === undefined || srcValue === "") {
        return objValue;
      }
      return srcValue;
    },

    // 新增暂不登录处理方法
    handleSkipLogin() {
      uni.navigateBack();
    },
    chooseAvatar() {
      uni.chooseImage({
        count: 1,
        success: (res) => {
          this.avatar = res.tempFilePaths[0];
        },
      });
    },
    async submitForm() {
      // 提交表单逻辑
      console.log(
        "提交表单:",
        this.nickname,
        this.genders[this.gender],
        this.birthday,
        this.phone,
        this.avatar
      );
      let userInfo = uni.getStorageSync("userInfo");
      console.log("userInfo", userInfo);
      let userData = {
        nickname: this.nickname,
        gender: this.genders[this.gender],
        birthday: this.birthday,
        mobile: this.phone,
        avatar: this.avatar,
        userId: userInfo.userId,
      };

      userData = mergeWith(userData, userInfo, this.customize);
      userData = mergeWith(userData, this.loginUserInfo, this.customize);
      console.log(userData);

      const udateUserRes = await request({
        url: "/user",
        method: "PUT",
        data: userData,
      });
      // 提交表单后请求用户详情数据
      const userId = userData.userId; // 假设这里能获取到用户ID
      const userDetailRes = await request({
        url: `/user/getUserInfo/${userId}`,
        method: "GET",
      });
      console.log("用户详情数据:", userDetailRes);
      // 提交成功后跳转
      uni.showToast({
        title: "登录成功",
        icon: "success",
        duration: 2000,
      });

      uni.setStorageSync("token", this.loginRes);

      mergeWith(userInfo, userDetailRes.data, this.customize);
      uni.setStorageSync("userInfo", userInfo);

      const pages = getCurrentPages();
      if (pages.length >= 2) {
        const prevPage = pages[pages.length - 2];
        prevPage.onLoad(); // 触发上一页的数据刷新
      }
      uni.navigateBack();
    },
    handleBirthdayChange(e) {
      this.birthday = e.detail.value;
    },
  },
};
</script>

<style>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f8f8f8;
}

.login-box {
  width: 80%;
}

.wechat-login-btn {
  background-color: #07c160;
  color: #ffffff;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
  font-size: 32rpx;
  border: none;
}

.wechat-login-btn::after {
  border: none;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.wechat-icon {
  width: 50rpx;
  height: 50rpx;
  margin-right: 30rpx;
  vertical-align: middle;
}

.skip-login {
  margin-top: 40rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.skip-login text {
  padding: 10rpx 20rpx;
}
.form-item {
  margin-bottom: 20rpx;
}
.form-item text {
  display: block;
  margin-bottom: 5rpx;
}
.form-item input {
  width: 100%;
  border: 1rpx solid #ccc;
  padding: 10rpx;
  border-radius: 5rpx;
}
.form-item .picker {
  border: 1rpx solid #ccc;
  padding: 10rpx;
  border-radius: 5rpx;
  background-color: #fff;
}
.form-item button {
  background-color: #07c160;
  color: #fff;
  border: none;
  padding: 10rpx 20rpx;
  border-radius: 5rpx;
}
</style>