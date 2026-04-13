<template>
  <view class="message">
    <view class="message-list">
      <view
        class="message-item"
        v-for="(item, index) in messages"
        :key="index"
        @tap="openChat(item)"
      >
        <image :src="item.avatar" class="avatar"></image>
        <view class="message-content">
          <view class="message-header">
            <text class="username">{{ item.username }}</text>
            <text class="time">{{ item.time }}</text>
          </view>
          <view class="message-body">
            <text class="last-message">{{ item.lastMessage }}</text>
            <view class="badge" v-if="item.unread">{{ item.unread }}</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      messages: [
        {
          id: 1,
          username: "李四",
          avatar: "/static/avatar/default.png",
          lastMessage: "请问这个商品还在吗？",
          time: "12:30",
          unread: 2,
        },
      ],
    };
  },
  onShow() {
  },
  methods: {
    openChat(message) {
      uni.navigateTo({
        url: `/pages/chat/chat?userId=${message.id}`,
      });
    },
  },
};
</script>

<style>
.message {
  padding: 20rpx;
}

.message-item {
  display: flex;
  padding: 20rpx;
  background: #fff;
  margin-bottom: 20rpx;
  border-radius: 10rpx;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  margin-right: 20rpx;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.username {
  font-size: 32rpx;
  color: #333;
}

.time {
  font-size: 24rpx;
  color: #999;
}

.message-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.last-message {
  font-size: 28rpx;
  color: #666;
}

.badge {
  background: #ff6b6b;
  color: #fff;
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  min-width: 40rpx;
  text-align: center;
}
</style>