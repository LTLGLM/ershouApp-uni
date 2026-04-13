<template>
  <view class="container">
    <!-- 地址列表页面 -->
    <view v-if="!showAddForm">
      <view class="address-list">
        <view
          class="address-item"
          v-for="(item, index) in addressList"
          :key="index"
          @tap="selectAddress(item)"
        >
          <view class="info">
            <text class="name">{{ item.name }}</text>
            <text class="phone">{{ item.tel }}</text>
          </view>
          <view class="address"
            >{{ item.campusName }} {{ item.floorName }}
            {{ item.addressDetail }}</view
          >
          <view class="bottom-row">
            <view class="actions">
              <button class="edit-btn" @tap.stop="editAddress(index)">
                编辑
              </button>
              <button class="delete-btn" @tap.stop="deleteAddress(index)">
                删除
              </button>
            </view>
            <view class="default-switch" @tap.stop>
              <text class="default-text">设为默认</text>
              <u-switch
                v-model="item.isDefaultSwitch"
                @change="(value) => handleDefaultChange(index, value)"
                :disabled="item.isDefault === 0"
              ></u-switch>
            </view>
          </view>
        </view>
      </view>

      <!-- 新增地址按钮 -->
      <view class="add-btn" @tap="showAddressForm">
        <u-icon name="plus" size="20"></u-icon>
        <text>新增地址</text>
      </view>
    </view>

    <!-- 新增地址表单页面 -->
    <view v-else class="add-form-container">
      <view class="form-header">
        <text class="back-icon" @tap="cancelAdd">
          <u-icon name="arrow-left" size="20"></u-icon>
        </text>
        <text class="title">{{ isEdit ? "编辑地址" : "新增地址" }}</text>
      </view>

      <u-form :model="form" ref="uForm" :border-bottom="true">
        <u-form-item label="收货人" prop="name" borderBottom>
          <u-input v-model="form.name" placeholder="请输入收货人姓名" />
        </u-form-item>
        <u-form-item label="联系电话" prop="tel" borderBottom>
          <u-input v-model="form.tel" placeholder="请输入联系电话" />
        </u-form-item>
        <u-form-item label="所在校区" prop="campusId" borderBottom>
          <u-picker
            :show="showCampusPicker"
            :columns="[campusColumns]"
            @confirm="onCampusConfirm"
            @cancel="showCampusPicker = false"
            :defaultIndex="[getDefaultCampusIndex()]"
            :immediateChange="true"
          ></u-picker>
          <view class="picker-value" @tap="showCampusPicker = true">
            <text :class="{ placeholder: !form.campusName }">{{
              form.campusName || "请选择所在校区"
            }}</text>
            <u-icon name="arrow-right" size="14"></u-icon>
          </view>
        </u-form-item>
        <u-form-item label="所在楼栋" prop="floorId" borderBottom>
          <u-picker
            :show="showFloorPicker"
            :columns="[floorColumns]"
            @confirm="onFloorConfirm"
            @cancel="showFloorPicker = false"
            :defaultIndex="[getDefaultFloorIndex()]"
          ></u-picker>
          <view class="picker-value" @tap="selectFloor">
            <text :class="{ placeholder: !form.floorName }">{{
              form.floorName || "请选择所在楼栋"
            }}</text>
            <u-icon name="arrow-right" size="14"></u-icon>
          </view>
        </u-form-item>
        <u-form-item label="详细地址" prop="addressDetail" borderBottom>
          <u-input v-model="form.addressDetail" placeholder="请输入详细地址" />
        </u-form-item>
      </u-form>

      <view class="btn-group">
        <button class="cancel-btn" @tap="cancelAdd">取消</button>
        <button class="confirm-btn" @tap="submitForm">确定</button>
      </view>
    </view>

    <!-- 校区选择器 -->
    <u-picker
      :show="showCampusPicker"
      :columns="[campusColumns]"
      @confirm="onCampusConfirm"
      @cancel="showCampusPicker = false"
    ></u-picker>

    <!-- 楼栋选择器 -->
    <u-picker
      :show="showFloorPicker"
      :columns="[floorColumns]"
      @confirm="onFloorConfirm"
      @cancel="showFloorPicker = false"
    ></u-picker>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";

export default {
  data() {
    return {
      showAddForm: false,
      isEdit: false,
      form: {
        addressId: "", // 地址ID（编辑时使用）
        name: "", // 收货人姓名
        tel: "", // 电话号码
        addressDetail: "", // 详细地址
        campusId: "", // 校区ID
        floorId: "", // 楼栋ID
        isDefault: 1, // 新增时默认为非默认地址
        userId: "", // 用户ID
      },
      addressList: [],
      userInfo: null,
      // 添加校区和楼栋数据
      campusList: [],
      floorList: [],
      // 添加选择器显示状态
      showCampusPicker: false,
      showFloorPicker: false,
      // 添加选择器数据
      campusColumns: [],
      floorColumns: [],
    };
  },
  onShow() {
    this.userInfo = uni.getStorageSync("userInfo");
    if (this.userInfo) {
      this.loadAddressList();
      this.loadCampusList(); // 加载校区列表
      this.loadFloorList(); // 加载楼栋列表，不依赖校区
    } else {
      uni.showToast({
        title: "请先登录",
        icon: "none",
      });
    }
  },
  methods: {
    // 加载地址列表
    async loadAddressList() {
      try {
        const res = await request({
          url: `/storeAddress/address/${this.userInfo.userId}`,
          method: "GET",
        });
        if (res.code === 200) {
          this.addressList = res.data.map((item) => ({
            ...item,
            isDefaultSwitch: item.isDefault === 0,
          }));
        }
      } catch (error) {
        uni.showToast({
          title: "加载地址失败",
          icon: "none",
        });
      }
    },

    // 加载校区列表
    async loadCampusList() {
      try {
        const res = await request({
          url: "/store-campus/all",
          method: "GET",
        });
        if (res.code === 200) {
          // 过滤未删除的校区
          this.campusList = res.data.filter((item) => !item.deleted);
          this.campusColumns = this.campusList.map((item) => ({
            text: item.campusName,
            value: item.campusId,
          }));
        }
      } catch (error) {
        uni.showToast({
          title: "加载校区失败",
          icon: "none",
        });
      }
    },

    // 加载楼栋列表
    async loadFloorList() {
      try {
        const res = await request({
          url: "/storeFloor/all",
          method: "GET",
        });
        if (res.code === 200) {
          // 只过滤未删除的楼栋，不再根据校区ID过滤
          this.floorList = res.data.filter((item) => !item.deleted);
          this.floorColumns = this.floorList.map((item) => ({
            text: item.floorName,
            value: item.floorId,
          }));
        }
      } catch (error) {
        uni.showToast({
          title: "加载楼栋失败",
          icon: "none",
        });
      }
    },

    // 显示新增地址表单
    showAddressForm() {
      this.isEdit = false;
      this.form = {
        name: "",
        tel: "",
        addressDetail: "",
        campusId: "",
        floorId: "",
        isDefault: 1, // 新增时默认为非默认地址
        userId: this.userInfo.userId,
      };
      this.showAddForm = true;
    },

    // 编辑地址
    editAddress(index) {
      this.isEdit = true;
      const currentAddress = this.addressList[index];
      this.form = {
        addressId: currentAddress.addressId,
        name: currentAddress.name,
        tel: currentAddress.tel,
        addressDetail: currentAddress.addressDetail,
        campusId: currentAddress.campusId,
        floorId: currentAddress.floorId,
        campusName: currentAddress.campusName,
        floorName: currentAddress.floorName,
        isDefault: currentAddress.isDefault,
        userId: this.userInfo.userId,
      };
      this.showAddForm = true;
    },

    // 删除地址
    async deleteAddress(index) {
      const address = this.addressList[index];
      uni.showModal({
        title: "提示",
        content: "确定删除该地址吗？",
        success: async (res) => {
          if (res.confirm) {
            try {
              const result = await request({
                url: `/storeAddress/${address.addressId}`,
                method: "DELETE",
              });
              if (result.code === 200) {
                uni.showToast({
                  title: "删除成功",
                  icon: "success",
                });
                this.loadAddressList(); // 重新加载地址列表
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

    // 设置默认地址
    async handleDefaultChange(index, value) {
      const address = this.addressList[index];

      // 如果已经是默认地址，直接返回
      if (address.isDefault === 0) {
        return;
      }

      try {
        const res = await request({
          url: "/storeAddress/default",
          method: "PUT",
          data: {
            addressId: address.addressId,
            userId: this.userInfo.userId,
          },
        });

        if (res.code === 200) {
          // 更新本地列表的默认状态
          this.addressList.forEach((item, idx) => {
            item.isDefault = idx === index ? 0 : 1;
            item.isDefaultSwitch = idx === index;
          });

          uni.showToast({
            title: "设置成功",
            icon: "success",
          });
        } else {
          // 如果设置失败，恢复开关状态
          this.addressList[index].isDefaultSwitch = !value;
          uni.showToast({
            title: res.message || "设置失败",
            icon: "none",
          });
        }
      } catch (error) {
        // 发生错误时恢复开关状态
        this.addressList[index].isDefaultSwitch = !value;
        uni.showToast({
          title: "设置失败",
          icon: "none",
        });
      }
    },

    // 提交表单
    async submitForm() {
      // 表单验证
      if (!this.validateForm()) {
        return;
      }

      try {
        const url = this.isEdit ? "/storeAddress" : "/storeAddress";
        const method = this.isEdit ? "PUT" : "POST";

        const res = await request({
          url,
          method,
          data: this.form,
        });

        if (res.code === 200) {
          uni.showToast({
            title: this.isEdit ? "修改成功" : "添加成功",
            icon: "success",
          });
          this.showAddForm = false;
          this.loadAddressList(); // 重新加载地址列表
        } else {
          uni.showToast({
            title: res.message || "操作失败",
            icon: "none",
          });
        }
      } catch (error) {
        uni.showToast({
          title: "操作失败",
          icon: "none",
        });
      }
    },

    // 表单验证
    validateForm() {
      if (!this.form.name.trim()) {
        uni.showToast({
          title: "请输入收货人姓名",
          icon: "none",
        });
        return false;
      }

      if (!this.form.tel.trim()) {
        uni.showToast({
          title: "请输入联系电话",
          icon: "none",
        });
        return false;
      }

      // 手机号格式验证
      if (!/^1[3-9]\d{9}$/.test(this.form.tel)) {
        uni.showToast({
          title: "请输入正确的手机号",
          icon: "none",
        });
        return false;
      }

      if (!this.form.campusId) {
        uni.showToast({
          title: "请选择所在校区",
          icon: "none",
        });
        return false;
      }

      if (!this.form.floorId) {
        uni.showToast({
          title: "请选择所在楼栋",
          icon: "none",
        });
        return false;
      }

      if (!this.form.addressDetail.trim()) {
        uni.showToast({
          title: "请输入详细地址",
          icon: "none",
        });
        return false;
      }

      return true;
    },

    // 取消添加/编辑
    cancelAdd() {
      uni.showModal({
        title: "提示",
        content: `确定要放弃${this.isEdit ? "编辑" : "新增"}吗？`,
        success: (res) => {
          if (res.confirm) {
            this.showAddForm = false;
          }
        },
      });
    },

    // 选择地址（用于订单页面）
    selectAddress(address) {
      const eventChannel = this.getOpenerEventChannel();
      if (eventChannel) {
        eventChannel.emit("addressSelected", address);
        uni.navigateBack();
      }
    },

    // 获取默认校区索引
    getDefaultCampusIndex() {
      if (!this.form.campusId) return 0;
      const index = this.campusList.findIndex(
        (item) => item.campusId === this.form.campusId
      );
      return index === -1 ? 0 : index;
    },

    // 获取默认楼栋索引
    getDefaultFloorIndex() {
      if (!this.form.floorId) return 0;
      const index = this.floorList.findIndex(
        (item) => item.floorId === this.form.floorId
      );
      return index === -1 ? 0 : index;
    },

    // 选择校区
    selectCampus() {
      this.showCampusPicker = true;
    },

    // 校区选择确认
    onCampusConfirm(e) {
      const selectedCampus = this.campusList.find(
        (item) => item.campusId === e.value[0].value
      );
      if (selectedCampus) {
        this.form.campusId = selectedCampus.campusId;
        this.form.campusName = selectedCampus.campusName;
        // 不再清空楼栋选择和重新加载楼栋列表
      }
      this.showCampusPicker = false;
    },

    // 选择楼栋
    selectFloor() {
      // 不再检查是否选择了校区
      this.showFloorPicker = true;
    },

    // 楼栋选择确认
    onFloorConfirm(e) {
      console.log(e);

      const selectedFloor = this.floorList.find(
        (item) => item.floorId === e.value[0].value
      );
      if (selectedFloor) {
        this.form.floorId = selectedFloor.floorId;
        this.form.floorName = selectedFloor.floorName;
      }
      this.showFloorPicker = false;
    },
  },
};
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  padding-bottom: 120rpx;
}

.address-list {
  .address-item {
    padding: 20rpx;
    margin-bottom: 20rpx;
    border-radius: 10rpx;
    background-color: #fff;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
  }
}

.info {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;

  .name {
    font-size: 32rpx;
    font-weight: bold;
    margin-right: 20rpx;
  }

  .phone {
    font-size: 28rpx;
    color: #666;
  }
}

.address {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 20rpx;
}

.bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .actions {
    display: flex;
    gap: 20rpx;

    button {
      margin: 0;
      padding: 0 20rpx;
      height: 50rpx;
      line-height: 50rpx;
      font-size: 24rpx;
      border-radius: 25rpx;
      background: none;

      &::after {
        border: none;
      }
    }

    .edit-btn {
      color: #1296db;
      border: 1rpx solid #1296db;
    }

    .delete-btn {
      color: #ff6b6b;
      border: 1rpx solid #ff6b6b;
    }
  }

  .default-switch {
    display: flex;
    align-items: center;

    .default-text {
      font-size: 26rpx;
      color: #666;
      margin-right: 10rpx;
    }
  }
}

.add-btn {
  position: fixed;
  right: 30rpx;
  top: 20rpx;
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  background: #1296db;
  color: #fff;
  border-radius: 30rpx;
  font-size: 28rpx;

  .u-icon {
    margin-right: 10rpx;
  }
}

.add-form-container {
  padding: 20rpx;

  .form-header {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    margin-bottom: 20rpx;

    .back-icon {
      padding: 10rpx;
      margin-right: 20rpx;
    }

    .title {
      font-size: 32rpx;
      font-weight: bold;
    }
  }

  .btn-group {
    margin-top: 60rpx;
    display: flex;
    justify-content: space-between;
    padding: 0 30rpx;

    button {
      width: 45%;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 40rpx;
      font-size: 30rpx;
    }

    .cancel-btn {
      background: #f5f5f5;
      color: #666;
    }

    .confirm-btn {
      background: #1296db;
      color: #fff;
    }
  }
}

.default-switch {
  .u-switch--disabled {
    opacity: 0.4;
  }
}

.picker-value {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;

  text {
    color: #333;
    font-size: 28rpx;

    &.placeholder {
      color: #999;
    }
  }

  .u-icon {
    color: #999;
  }
}
</style>
