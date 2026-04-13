<template>
  <view class="sell">
    <form @submit="submitForm">
      <view class="form-item">
        <text class="label">商品名称</text>
        <input
          type="text"
          v-model="form.goodName"
          placeholder="请输入商品名称"
        />
      </view>

      <view class="form-item">
        <text class="label">商品分类</text>
        <picker
          @change="categoryChange"
          :value="categoryIndex"
          :range="categoryList"
          range-key="cateName"
        >
          <view class="picker">
            {{ selectedCategory ? selectedCategory.cateName : "请选择分类" }}
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">价格</text>
        <input type="digit" v-model="form.price" placeholder="请输入价格" />
      </view>

      <view class="form-item">
        <text class="label">商品成色</text>
        <picker
          @change="conditionChange"
          :value="conditionIndex"
          :range="conditions"
        >
          <view class="picker">
            {{ conditions[conditionIndex] }}
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">使用情况</text>
        <textarea
          v-model="usageDescription"
          placeholder="请详细描述商品使用情况"
        ></textarea>
      </view>

      <view class="form-item">
        <text class="label">关键词</text>
        <input
          type="text"
          v-model="form.keyword"
          placeholder="请输入商品关键词，用逗号分隔"
        />
      </view>

      <view class="form-item">
        <text class="label">原价</text>
        <input
          type="digit"
          v-model="form.originalPrice"
          placeholder="请输入商品原价"
        />
      </view>

      <view class="form-item">
        <text class="label">跑腿费</text>
        <input
          type="digit"
          v-model="form.postage"
          placeholder="请输入跑腿费"
          :disabled="form.isPostage"
          :style="form.isPostage ? 'background-color: #f5f5f5;' : ''"
        />
      </view>

      <view class="form-item">
        <text class="label">单位名</text>
        <input
          type="text"
          v-model="form.unitName"
          placeholder="请输入单位名，如件、个等"
        />
      </view>

      <view class="form-item">
        <text class="label">库存</text>
        <input
          type="number"
          v-model="form.stock"
          placeholder="请输入库存数量"
        />
      </view>

      <view class="form-item">
        <text class="label">是否包邮</text>
        <u-switch v-model="form.isPostage"></u-switch>
      </view>

      <view class="form-item">
        <text class="label">商品图片</text>
        <view class="upload-single">
          <image
            v-if="form.image"
            :src="'http://localhost:8089' + form.image"
            mode="aspectFill"
            class="preview-image"
          ></image>
          <view class="upload-btn" @tap="chooseMainImage" v-else>
            <text class="plus">+</text>
          </view>
        </view>
      </view>

      <view class="form-item">
        <text class="label">轮播图</text>
        <view class="upload-list">
          <view
            class="upload-item"
            v-for="(img, index) in form.sliderImage"
            :key="index"
          >
            <image
              :src="'http://localhost:8089' + img"
              mode="aspectFill"
            ></image>
            <text class="delete" @tap="deleteImage(index)">×</text>
          </view>
          <view
            class="upload-btn"
            @tap="chooseSliderImage"
            v-if="form.sliderImage.length < 9"
          >
            <text class="plus">+</text>
          </view>
        </view>
      </view>

      <button class="submit-btn" form-type="submit">发布商品</button>
    </form>
  </view>
</template>

<script>
import { request } from "@/utils/request.js"; // 导入封装的 request 方法
import authMixin from "@/common/mixins/authMixin.js";
export default {
  mixins: [authMixin],
  data() {
    return {
      categoryIndex: 0,
      categoryList: [], // 存储分类列表
      selectedCategory: null, // 存储选中的分类
      conditionIndex: 0,
      conditions: ["9成新", "8成新", "7成新"],
      usageDescription: "", // 新增使用情况描述字段
      form: {
        goodName: "", // 商品名称
        cateId: "", // 分类ID
        price: "", // 价格
        originalPrice: "", // 原价
        postage: "", // 跑腿费
        unitName: "", // 单位名
        stock: "", // 库存
        isPostage: false, // 是否包邮
        keyword: "", // 关键词
        goodInfo: "", // 商品简介（原description）
        image: "", // 商品主图
        sliderImage: [], // 轮播图数组
        userId: "", // 用户ID
      },
    };
  },
  onShow() {
    this.getSecondCategory();
  },
  watch: {
    "form.isPostage"(newVal) {
      if (newVal) {
        this.form.postage = "0";
      }
    },
  },
  methods: {
    // 获取二级分类菜单
    getSecondCategory() {
      request({
        url: "/storeCate/secondCategory",
        method: "GET",
      }).then((res) => {
        if (res.code === 200 && Array.isArray(res.data)) {
          // 过滤掉已删除的分类（delFlag === 1）
          this.categoryList = res.data.filter((item) => item.delFlag === 0);
        }
      });
    },
    categoryChange(e) {
      this.categoryIndex = e.detail.value;
      this.selectedCategory = this.categoryList[this.categoryIndex];
      this.form.cateId = this.selectedCategory.cateId;
    },
    chooseMainImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          uni.showLoading({
            title: "上传中...",
            mask: true,
          });
          uni.uploadFile({
            url: "http://localhost:8089/upload",
            filePath: res.tempFilePaths[0],
            name: "file",
            success: (uploadRes) => {
              uni.hideLoading();
              const data = JSON.parse(uploadRes.data);
              if (data.code === 200) {
                this.form.image = data.data;
                uni.showToast({
                  title: "上传成功",
                  icon: "success",
                });
              } else {
                uni.showToast({
                  title: data.msg || "图片上传失败",
                  icon: "none",
                });
              }
            },
            fail: (err) => {
              uni.hideLoading();
              console.error("上传失败:", err);
              uni.showToast({
                title: "图片上传失败",
                icon: "none",
              });
            },
          });
        },
      });
    },
    chooseSliderImage() {
      uni.chooseImage({
        count: 9 - this.form.sliderImage.length,
        sizeType: ["compressed"],
        sourceType: ["album", "camera"],
        success: (res) => {
          uni.showLoading({
            title: "上传中...",
            mask: true,
          });

          const uploadPromises = res.tempFilePaths.map((path) => {
            return new Promise((resolve, reject) => {
              uni.uploadFile({
                url: "http://localhost:8089/upload",
                filePath: path,
                name: "file",
                success: (uploadRes) => {
                  const data = JSON.parse(uploadRes.data);
                  if (data.code === 200) {
                    resolve(data.data);
                  } else {
                    reject(new Error(data.msg || "上传失败"));
                  }
                },
                fail: (err) => {
                  reject(err);
                },
              });
            });
          });

          Promise.all(uploadPromises)
            .then((urls) => {
              uni.hideLoading();
              this.form.sliderImage.push(...urls);
              uni.showToast({
                title: "上传成功",
                icon: "success",
              });
            })
            .catch((error) => {
              uni.hideLoading();
              console.error("上传失败:", error);
              uni.showToast({
                title: "部分图片上传失败",
                icon: "none",
              });
            });
        },
      });
    },
    deleteImage(index) {
      this.form.sliderImage.splice(index, 1);
    },
    conditionChange(e) {
      this.conditionIndex = e.detail.value;
    },
    submitForm() {
      // 登录验证
      if (!uni.getStorageSync("token")) {
        uni.showToast({
          title: "请先登录",
          icon: "none",
        });
        return;
      }

      // 表单验证
      if (!this.form.goodName.trim()) {
        uni.showToast({
          title: "请输入商品名称",
          icon: "none",
        });
        return;
      }

      if (!this.form.cateId) {
        uni.showToast({
          title: "请选择商品分类",
          icon: "none",
        });
        return;
      }

      if (!this.form.price) {
        uni.showToast({
          title: "请输入商品价格",
          icon: "none",
        });
        return;
      }
      if (isNaN(Number(this.form.price)) || Number(this.form.price) <= 0) {
        uni.showToast({
          title: "商品价格必须为大于0的数字",
          icon: "none",
        });
        return;
      }

      // 验证使用情况描述
      if (!this.usageDescription.trim()) {
        uni.showToast({
          title: "请输入使用情况",
          icon: "none",
        });
        return;
      }

      // 组合成色和使用情况
      this.form.goodInfo = `成色：${
        this.conditions[this.conditionIndex]
      }\n使用情况：${this.usageDescription.trim()}`;

      if (!this.form.keyword.trim()) {
        uni.showToast({
          title: "请输入关键词",
          icon: "none",
        });
        return;
      }

      if (!this.form.originalPrice) {
        uni.showToast({
          title: "请输入商品原价",
          icon: "none",
        });
        return;
      }
      if (
        isNaN(Number(this.form.originalPrice)) ||
        Number(this.form.originalPrice) <= 0
      ) {
        uni.showToast({
          title: "商品原价必须为大于0的数字",
          icon: "none",
        });
        return;
      }

      if (!this.form.isPostage) {
        if (!this.form.postage) {
          uni.showToast({
            title: "请输入跑腿费",
            icon: "none",
          });
          return;
        }
        if (isNaN(Number(this.form.postage)) || Number(this.form.postage) < 0) {
          uni.showToast({
            title: "跑腿费必须为非负数",
            icon: "none",
          });
          return;
        }
      }

      if (!this.form.unitName.trim()) {
        uni.showToast({
          title: "请输入单位名",
          icon: "none",
        });
        return;
      }

      if (!this.form.stock) {
        uni.showToast({
          title: "请输入库存数量",
          icon: "none",
        });
        return;
      }
      if (
        isNaN(Number(this.form.stock)) ||
        !Number.isInteger(Number(this.form.stock)) ||
        Number(this.form.stock) <= 0
      ) {
        uni.showToast({
          title: "库存必须为大于0的整数",
          icon: "none",
        });
        return;
      }

      if (!this.form.image) {
        uni.showToast({
          title: "请上传商品主图",
          icon: "none",
        });
        return;
      }

      if (this.form.sliderImage.length === 0) {
        uni.showToast({
          title: "请至少上传一张轮播图",
          icon: "none",
        });
        return;
      }

      // 转换所有数值字段为数字类型
      this.form.price = Number(this.form.price);
      this.form.originalPrice = Number(this.form.originalPrice);
      this.form.postage = Number(this.form.postage);
      this.form.stock = Number(this.form.stock);
      // 将布尔值转换为数字
      this.form.isPostage = this.form.isPostage ? 1 : 0;
      this.form.userId = uni.getStorageSync("userInfo").userId;

      // 显示加载提示
      uni.showLoading({
        title: "发布中...",
        mask: true,
      });

      // 提交表单
      request({
        url: "/storeGood",
        method: "POST",
        data: {
          ...this.form,
          sliderImage: this.form.sliderImage.join(","),
        },
      })
        .then((res) => {
          uni.hideLoading();
          if (res.code === 200) {
            uni.showToast({
              title: "发布成功",
              icon: "success",
              duration: 2000,
              success: () => {
                // 清空表单数据
                this.resetForm();
                setTimeout(() => {
                  uni.navigateBack();
                }, 2000);
              },
            });
          } else {
            uni.showToast({
              title: res.msg || "发布失败",
              icon: "none",
              duration: 2000,
            });
          }
        })
        .catch((error) => {
          uni.hideLoading();
          console.error("发布失败:", error);
          uni.showToast({
            title: "发布失败，请重试",
            icon: "none",
            duration: 2000,
          });
        });
    },

    // 添加重置表单方法
    resetForm() {
      this.categoryIndex = 0;
      this.selectedCategory = null;
      this.conditionIndex = 0;
      this.usageDescription = "";
      this.form = {
        goodName: "",
        cateId: "",
        price: "",
        originalPrice: "",
        postage: "",
        unitName: "",
        stock: "",
        isPostage: false,
        keyword: "",
        goodInfo: "",
        image: "",
        sliderImage: [],
        userId: "",
      };
    },
  },
};
</script>

<style>
.sell {
  padding: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.label {
  display: block;
  margin-bottom: 10rpx;
  font-size: 28rpx;
  color: #333;
}

input,
.picker {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
}

textarea {
  width: 100%;
  height: 200rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 20rpx;
}

.upload-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.upload-item,
.upload-btn {
  width: 200rpx;
  height: 200rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  position: relative;
}

.upload-item image {
  width: 100%;
  height: 100%;
}

.delete {
  position: absolute;
  right: -10rpx;
  top: -10rpx;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f8f8;
}

.plus {
  font-size: 60rpx;
  color: #999;
}

.submit-btn {
  background: #1296db;
  color: #fff;
  margin-top: 40rpx;
}

.picker {
  width: 100%;
  height: 80rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  padding: 0 20rpx;
  line-height: 80rpx;
  color: #333;
}

.picker:empty::before {
  content: "请选择分类";
  color: #999;
}

.upload-single {
  width: 200rpx;
  height: 200rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
