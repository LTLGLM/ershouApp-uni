<template>
  <view class="product-detail">
    <!-- 售罄遮罩层 -->
    <view class="sold-out-overlay" v-if="isSoldOut">
      <view class="sold-out-content">
        <text class="sold-out-text">商品已售罄</text>
        <button class="back-btn" @tap="goBack">返回上一页</button>
      </view>
    </view>
    <!-- 商品图片轮播 -->
    <swiper class="product-swiper" circular indicator-dots autoplay>
      <swiper-item v-for="(image, index) in sliderImages" :key="index">
        <image
          :src="imgUrl + image"
          mode="aspectFill"
          class="slide-image"
          @tap="previewImage(index)"
        ></image>
      </swiper-item>
    </swiper>

    <!-- 商品信息 -->
    <view class="product-info">
      <view class="price-row">
        <text class="price">¥{{ product.price }}</text>
        <text class="original-price">¥{{ product.originalPrice }}</text>
      </view>
      <view class="title">{{ product.title }}</view>
      <view class="stats">
        <text>浏览 {{ product.browse }}</text>
        <text>收藏 {{ product.collectCount }}</text>
        <text>库存 {{ product.stock }}</text>
        <text>发布时间 {{ product.addTime }}</text>
      </view>
    </view>

    <!-- 卖家信息 -->
    <view class="seller-card">
      <view class="seller-info">
        <image :src="processedAvatar" class="seller-avatar"></image>
        <view class="seller-detail">
          <text class="seller-name">{{ product.username }}</text>
          <text v-if="product.school" class="seller-school">{{
            product.school
          }}</text>
        </view>
      </view>
      <button class="contact-btn" @tap="contactSeller">联系卖家</button>
    </view>

    <!-- 商品详情 -->
    <view class="detail-section">
      <view class="section-title">商品详情</view>
      <view class="detail-content">
        <text class="description">{{ product.description }}</text>
        <view class="attributes">
          <view class="attribute-item">
            <text class="label">成色</text>
            <text class="value">{{ conditionInfo }}</text>
          </view>
          <view class="attribute-item">
            <text class="label">商品分类</text>
            <text class="value">{{ product.cateName }}</text>
          </view>
          <view class="attribute-item">
            <text class="label">商品信息</text>
            <text class="value">{{ product.goodInfo }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comment-section">
      <view class="section-title">商品留言 ({{ commentTotal }})</view>
      
      <view class="comment-list">
        <view class="comment-item" v-for="item in commentList" :key="item.commentId">
          <image :src="processAvatar(item.avatar)" class="comment-avatar" mode="aspectFill"></image>
          <view class="comment-content-box">
            <view class="comment-header">
              <text class="comment-user">{{ item.nickname || '匿名用户' }}</text>
              <text class="comment-time">{{ formatDate(item.createTime) }}</text>
            </view>
            <view class="comment-text">{{ item.content }}</view>
            
            <!-- 卖家回复 -->
            <view class="reply-box" v-if="item.replyContent">
              <text class="reply-label">卖家回复：</text>
              <text class="reply-content">{{ item.replyContent }}</text>
              <view class="reply-time">{{ formatDate(item.replyTime) }}</view>
            </view>
            
            <!-- 卖家回复按钮 -->
            <view class="reply-action" v-if="isSeller && !item.replyContent">
              <text class="reply-btn-text" @tap="openReplyModal(item)">回复</text>
            </view>
          </view>
        </view>
        <u-empty v-if="commentList.length === 0" mode="message" text="暂无留言" margin-top="30"></u-empty>
      </view>

      <!-- 发表评论输入框 (非卖家且已登录显示) -->
      <view class="comment-input-area" v-if="!isSeller && userInfo">
        <u--input
          placeholder="对商品感兴趣？留言问问卖家吧"
          border="surround"
          v-model="commentContent"
          shape="circle"
        ></u--input>
        <view class="send-btn" @tap="submitComment">发送</view>
      </view>
      <view class="login-tip" v-if="!userInfo" @tap="goToLogin">
        登录后可发表留言
      </view>
    </view>

    <!-- 回复弹窗 -->
    <u-modal 
      :show="showReplyModal" 
      title="回复留言" 
      showCancelButton 
      @confirm="submitReply" 
      @cancel="showReplyModal = false"
    >
      <view class="slot-content" style="width: 100%; padding: 20rpx;">
        <u--textarea v-model="replyContent" placeholder="请输入回复内容" count></u--textarea>
      </view>
    </u-modal>

    <!-- 底部操作栏 -->
    <view class="action-bar">
      <view class="left-actions">
        <view class="action-item" @tap="toggleFavorite">
          <u-icon
            :name="product.isCollect ? 'star-fill' : 'star'"
            size="20"
          ></u-icon>
          <text>收藏</text>
        </view>
        <view class="action-item" @tap="shareProduct">
          <u-icon name="share" size="20"></u-icon>
          <text>分享</text>
        </view>
      </view>
      <view class="right-actions">
        <button class="add-cart-btn" @tap="addToCart">加入购物车</button>
        <button class="buy-btn" @tap="buyNow">立即购买</button>
      </view>
    </view>
  </view>
</template>

<script>
import { request } from "@/utils/request.js";
export default {
  data() {
    return {
      id: null,
      imgUrl: "http://localhost:8089",
      product: {},
      userInfo: {},
      isSoldOut: false,
      // 评论相关数据
      commentList: [],
      commentTotal: 0,
      commentContent: '',
      replyContent: '',
      currentReplyComment: null,
      showReplyModal: false,
    };
  },
  onLoad(options) {
    this.id = options.id;
    // 获取售罄状态
    this.isSoldOut = options.soldOut === 'true';
    this.userInfo = uni.getStorageSync("userInfo");
    // 这里应该根据id请求商品详情
    this.loadProductDetail();
    // 加载评论列表
    this.loadComments();
  },
  methods: {
    // 格式化时间
    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      return `${year}-${month}-${day} ${hour}:${minute}`;
    },
    // 处理头像路径
    processAvatar(avatar) {
      if (!avatar) return '/static/logo.png'; // 默认头像
      if (avatar.startsWith('http')) return avatar;
      return this.imgUrl + avatar.replace(/\/dev-api/, "");
    },
    // 跳转登录
    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' });
    },
    // 加载评论列表
    async loadComments() {
      try {
        const res = await request({
          url: '/store/comment/list',
          method: 'GET',
          data: {
            goodId: this.id,
            pageNum: 1,
            pageSize: 100 // 简单起见，一次加载多条，实际可做分页
          }
        });
        if (res.code === 200) {
          this.commentList = res.data.rows;
          this.commentTotal = res.data.total;
        }
      } catch (e) {
        console.error('加载评论失败', e);
      }
    },
    // 提交评论
    async submitComment() {
      if (!this.commentContent.trim()) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' });
        return;
      }
      
      try {
        const res = await request({
          url: '/store/comment/add',
          method: 'POST',
          data: {
            goodId: this.id,
            content: this.commentContent
          }
        });
        
        if (res.code === 200) {
          uni.showToast({ title: '留言成功', icon: 'success' });
          this.commentContent = '';
          this.loadComments(); // 刷新列表
        } else {
          uni.showToast({ title: res.msg || '留言失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    // 打开回复弹窗
    openReplyModal(comment) {
      this.currentReplyComment = comment;
      this.replyContent = '';
      this.showReplyModal = true;
    },
    // 提交回复
    async submitReply() {
      if (!this.replyContent.trim()) {
        uni.showToast({ title: '请输入回复内容', icon: 'none' });
        return;
      }
      
      try {
        const res = await request({
          url: '/store/comment/reply',
          method: 'POST',
          data: {
            commentId: this.currentReplyComment.commentId,
            replyContent: this.replyContent
          }
        });
        
        if (res.code === 200) {
          uni.showToast({ title: '回复成功', icon: 'success' });
          this.showReplyModal = false;
          this.loadComments(); // 刷新列表
        } else {
          uni.showToast({ title: res.msg || '回复失败', icon: 'none' });
        }
      } catch (e) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      }
    },
    async loadProductDetail() {
      uni.showLoading({ title: "加载中..." });
      try {
        const res = await request({
          url: `/storeGood/${parseInt(this.id)}`,
          method: "GET",
        });
        this.product = res.data;
        
        // 添加浏览记录
        if (this.userInfo) {
          try {
            await request({
              url: '/storeGood/view',
              method: 'POST',
              data: {
                userId: this.userInfo.userId,
                goodId: this.id
              }
            });
          } catch (error) {
            console.error('添加浏览记录失败:', error);
          }
        }
      } catch (e) {
        uni.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        uni.hideLoading();
      }
    },
    previewImage(index) {
      uni.previewImage({
        current: index,
        urls: this.product.images,
      });
    },
    contactSeller() {
      const userInfo = uni.getStorageSync("userInfo");
      if (this.product.userId === userInfo.userId) {
        // 假设this.userId是当前用户的ID
        uni.showToast({ title: "不能联系自己", icon: "none" });
        return;
      }
      uni.navigateTo({
        url: `/pages/chat/chat?userId=${this.product.seller.id}`,
      });
    },
    toggleFavorite() {
      // 检查是否登录
      if (!this.userInfo) {
        uni.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }

      // 检查是否是自己的商品
      if (this.product.userId === this.userInfo.userId) {
        uni.showToast({
          title: "不能收藏自己的商品",
          icon: "none"
        });
        return;
      }

      // 根据当前收藏状态调用不同的接口
      const url = this.product.isCollect ? '/storeUserCollect/cancel' : '/storeUserCollect/add';
      const method = this.product.isCollect ? 'DELETE' : 'POST';
      
      request({
        url: url,
        method: method,
        data: {
          userId: this.userInfo.userId,
          goodId: this.id
        }
      }).then(res => {
        if (res.code === 200) {
          this.product.isCollect = !this.product.isCollect;
          uni.showToast({
            title: this.product.isCollect ? '收藏成功' : '取消收藏成功',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: res.msg || '操作失败',
            icon: 'none'
          });
        }
      }).catch(error => {
        console.error('收藏操作失败:', error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      });
    },
    shareProduct() {
      uni.share({
        provider: "weixin",
        scene: "WXSceneSession",
        type: 0,
        title: this.product.title,
        imageUrl: this.product.images[0],
      });
    },
    async addToCart() {
      // 检查是否登录
      if (!this.userInfo) {
        uni.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }

      // 检查是否是自己的商品
      if (this.product.userId === this.userInfo.userId) {
        uni.showToast({
          title: "不能购买自己的商品",
          icon: "none"
        });
        return;
      }

      // 检查商品是否已售罄
      if (this.isSoldOut) {
        uni.showToast({
          title: "商品已售罄",
          icon: "none"
        });
        return;
      }

      try {
        const res = await request({
          url: `/storeCart/add/${this.userInfo.userId}/${this.product.goodId}`,
          method: "POST",
        });
        if (res.code == 200) {
          uni.showToast({
            title: "已加入购物车",
            icon: "success",
          });
        } else {
          uni.showToast({
            title: res.msg || "添加失败",
            icon: "none",
          });
        }
      } catch (error) {
        console.error("加入购物车失败:", error);
        uni.showToast({
          title: "加入购物车失败",
          icon: "none",
        });
      }
    },
    async buyNow() {
      // 检查是否登录
      if (!this.userInfo) {
        uni.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }

      // 检查是否是自己的商品
      if (this.product.userId === this.userInfo.userId) {
        uni.showToast({
          title: "不能购买自己的商品",
          icon: "none"
        });
        return;
      }

      // 检查商品是否已售罄
      if (this.isSoldOut) {
        uni.showToast({
          title: "商品已售罄",
          icon: "none"
        });
        return;
      }

      try {
        // 先添加到购物车
        const res = await request({
          url: `/storeCart/add/${this.userInfo.userId}/${this.product.goodId}`,
          method: "POST",
        });
        
        if (res.code === 200) {
          // 添加成功后跳转到购物车页面
          uni.switchTab({
            url: '/pages/cart/cart',
            success: () => {
              uni.showToast({
                title: '已添加到购物车',
                icon: 'success'
              });
            }
          });
        } else {
          uni.showToast({
            title: res.msg || '添加失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error("购买失败:", error);
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    goBack() {
      uni.navigateBack();
    },
  },
  computed: {
    sliderImages() {
      return this.product.sliderImage?.split(",") || [];
    },
    conditionInfo() {
      if (!this.product.goodInfo) return "";
      const match = this.product.goodInfo.match(/成色：([^\n]+)/);
      return match ? match[1] : this.product.goodInfo;
    },
    processedAvatar() {
      return this.product.userAvatar?.replace(/\/dev-api/, "") || "";
    },
    // 判断是否是卖家
    isSeller() {
      return this.product.userId && this.userInfo && this.product.userId === this.userInfo.userId;
    },
  },
};
</script>

<style>
.product-detail {
  padding-bottom: 100rpx;
  background: #f8f8f8;
}

/* 评论区样式 */
.comment-section {
  background: #fff;
  padding: 20rpx;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.comment-list {
  margin-bottom: 20rpx;
}

.comment-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.comment-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.comment-content-box {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.comment-user {
  font-size: 28rpx;
  color: #333;
  font-weight: bold;
}

.comment-time {
  font-size: 24rpx;
  color: #999;
}

.comment-text {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 10rpx;
}

.reply-box {
  background: #f5f5f5;
  padding: 15rpx;
  border-radius: 8rpx;
  margin-top: 10rpx;
}

.reply-label {
  font-size: 26rpx;
  color: #333;
  font-weight: bold;
}

.reply-content {
  font-size: 26rpx;
  color: #666;
}

.reply-time {
  font-size: 22rpx;
  color: #999;
  margin-top: 5rpx;
  text-align: right;
}

.reply-action {
  display: flex;
  justify-content: flex-end;
  margin-top: 10rpx;
}

.reply-btn-text {
  font-size: 24rpx;
  color: #1296db;
  padding: 5rpx 15rpx;
}

.comment-input-area {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1px solid #eee;
}

.send-btn {
  background: #1296db;
  color: white;
  font-size: 28rpx;
  padding: 0 30rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 30rpx;
  margin-left: 20rpx;
}

.login-tip {
  text-align: center;
  padding: 30rpx;
  color: #1296db;
  font-size: 28rpx;
}

.product-swiper {
  width: 100%;
  height: 750rpx;
}

.slide-image {
  width: 100%;
  height: 100%;
}

.product-info {
  background: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.price-row {
  display: flex;
  align-items: baseline;
}

.price {
  font-size: 48rpx;
  color: #ff6b6b;
  font-weight: bold;
}

.original-price {
  font-size: 24rpx;
  color: #999;
  text-decoration: line-through;
  margin-left: 20rpx;
}

.title {
  font-size: 32rpx;
  color: #333;
  margin: 20rpx 0;
  line-height: 1.4;
}

.stats {
  display: flex;
  font-size: 24rpx;
  color: #999;
  gap: 20rpx;
}

.seller-card {
  background: #fff;
  padding: 20rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.seller-info {
  display: flex;
  align-items: center;
}

.seller-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.seller-detail {
  display: flex;
  flex-direction: column;
}

.seller-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 4rpx;
}

.seller-school {
  font-size: 24rpx;
  color: #999;
}

.contact-btn {
  background: #1296db;
  color: #fff;
  font-size: 28rpx;
  padding: 10rpx 30rpx;
  border-radius: 30rpx;
}

.detail-section {
  background: #fff;
  padding: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.description {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.attributes {
  margin-top: 20rpx;
}

.attribute-item {
  display: flex;
  margin: 10rpx 0;
}

.label {
  width: 140rpx;
  color: #999;
  font-size: 26rpx;
}

.value {
  color: #333;
  font-size: 26rpx;
}

.action-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.left-actions {
  display: flex;
  gap: 20rpx;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 20rpx;
  color: #666;
}

.action-item .iconfont {
  font-size: 40rpx;
  margin-bottom: 4rpx;
}

.right-actions {
  display: flex;
  gap: 20rpx;
}

.add-cart-btn {
  background: #ff9500;
  color: #fff;
  font-size: 28rpx;
  padding: 0 30rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
}

.buy-btn {
  background: #ff6b6b;
  color: #fff;
  font-size: 28rpx;
  padding: 0 30rpx;
  height: 70rpx;
  line-height: 70rpx;
  border-radius: 35rpx;
}

.sold-out-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  z-index: 999;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sold-out-content {
  text-align: center;
}

.sold-out-text {
  font-size: 36rpx;
  color: #ff6b6b;
  font-weight: bold;
  margin-bottom: 40rpx;
  display: block;
}

.back-btn {
  background: #ff6b6b;
  color: #fff;
  border: none;
  padding: 20rpx 60rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
}

.back-btn:active {
  opacity: 0.8;
}
</style>
