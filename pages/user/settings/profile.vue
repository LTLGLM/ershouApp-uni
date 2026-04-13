<template>
  <view class="profile-container">
    <u-form :model="form" ref="uForm">
      <u-form-item label="头像" prop="avatar">
        <u-upload
          :fileList="fileList"
          @afterRead="afterRead"
          @delete="deletePic"
          name="avatar"
          :maxCount="1"
        ></u-upload>
      </u-form-item>

      <u-form-item label="用户名" prop="username">
        <u-input v-model="form.username" placeholder="请输入用户名" />
      </u-form-item>

      <u-form-item label="手机号" prop="mobile">
        <u-input v-model="form.mobile" placeholder="请输入手机号" />
      </u-form-item>

      <u-form-item label="生日" prop="birthday">
        <u-input
          v-model="form.birthday"
          placeholder="请选择生日"
          @click="showDatePicker"
        />
      </u-form-item>
    </u-form>

    <view class="submit-btn">
      <u-button type="primary" @click="submitForm">保存修改</u-button>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";
import { mapGetters } from "vuex";

// 基础URL配置
const BASE_URL = "http://localhost:8089";
const API = {
  USER_INFO: "/storeUser",
  USER_UPDATE: "/storeUser",
  UPLOAD: "/upload",
};

export default {
  data() {
    return {
      form: {
        userId: "",
        username: "",
        mobile: "",
        birthday: "",
        avatar: "",
        gender: "",
        nickname: "",
      },
      fileList: [],
      userInfo: null,
      rules: {
        username: [
          { required: true, message: "请输入用户名", trigger: "blur" },
          {
            min: 2,
            max: 20,
            message: "用户名长度在2-20个字符之间",
            trigger: "blur",
          },
        ],
        mobile: [
          { required: true, message: "请输入手机号", trigger: "blur" },
          {
            pattern: /^1[3-9]\d{9}$/,
            message: "请输入正确的手机号",
            trigger: "blur",
          },
        ],
        birthday: [
          { required: true, message: "请选择生日", trigger: "change" },
        ],
      },
    };
  },
  computed: {
    ...mapGetters(["userInfo"]),
  },
  onLoad() {
    this.userInfo = uni.getStorageSync("userInfo");
    this.getUserInfo();
  },
  methods: {
    // 处理图片URL，添加基础URL
    handleImageUrl(url) {
      if (!url) return "";
      return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    },

    async getUserInfo() {
      if (!this.userInfo || !this.userInfo.userId) {
        uni.showToast({
          title: "用户信息获取失败",
          icon: "none",
        });
        return;
      }
      try {
        const res = await request({
          url: `${API.USER_INFO}/${this.userInfo.userId}`,
          method: "GET",
        });
        if (res.code === 200) {
          const userData = res.data;
          this.form = {
            userId: userData.userId,
            username: userData.username,
            mobile: userData.mobile,
            birthday: userData.birthday,
            avatar: userData.avatar,
            gender: userData.gender,
            nickname: userData.nickname,
          };
          if (userData.avatar) {
            this.fileList = [
              {
                url: userData.avatar,
                status: "success",
              },
            ];
          }
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

    async afterRead(event) {
      const { file } = event;
      try {
        const res = await uni.uploadFile({
          url: `${BASE_URL}${API.UPLOAD}`,
          filePath: file.url,
          name: "file",
        });
        const data = JSON.parse(res.data);
        if (data.code === 200) {
          // 保存相对路径
          this.form.avatar = data.data;
          // 显示完整URL
          this.fileList = [
            {
              url: `${BASE_URL}${data.data}`,
              status: "success",
            },
          ];
        } else {
          uni.showToast({
            title: data.message || "上传失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("上传失败:", error);
        uni.showToast({
          title: "上传失败",
          icon: "none",
        });
      }
    },

    deletePic() {
      this.form.avatar = "";
      this.fileList = [];
    },

    async submitForm() {
      try {
        await this.$refs.uForm.validate();
        const res = await request({
          url: API.USER_UPDATE,
          method: "PUT",
          data: {
            userId: this.form.userId,
            username: this.form.username,
            mobile: this.form.mobile,
            birthday: this.form.birthday,
            avatar: this.form.avatar,
            gender: this.form.gender,
            nickname: this.form.nickname,
          },
        });
        if (res.code === 200) {
          uni.showToast({
            title: res.message || "修改成功",
            icon: "success",
          });
          // 更新本地存储的用户信息
          const updatedUserInfo = {
            ...this.userInfo,
            username: this.form.username,
            mobile: this.form.mobile,
            avatar: this.form.avatar,
            nickname: this.form.nickname,
          };
          uni.setStorageSync("userInfo", updatedUserInfo);
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({
            title: res.message || "修改失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("修改失败:", error);
        uni.showToast({
          title: "修改失败",
          icon: "none",
        });
      }
    },
    showDatePicker() {
      uni.showDatePicker({
        current: this.form.birthday || new Date().getTime(),
        startDate: "1900-01-01",
        endDate: new Date().toISOString().split("T")[0],
        success: (res) => {
          this.form.birthday = res.date;
        },
      });
    },
  },
};
</script>

<style>
.profile-container {
  padding: 20rpx;
}
.submit-btn {
  margin-top: 40rpx;
  padding: 0 30rpx;
}
</style>
