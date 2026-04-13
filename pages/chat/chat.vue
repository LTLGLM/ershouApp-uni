<template>
  <view class="chat">
    <scroll-view 
      class="chat-messages" 
      scroll-y="true"
      :scroll-into-view="scrollToMessage"
      :scroll-with-animation="true"
    >
      <view class="message-list">
        <view 
          v-for="(message, index) in messages" 
          :key="index"
          :id="'msg-' + index"
          class="message-item"
          :class="{ 'message-self': message.isSelf }"
        >
          <image 
            :src="message.avatar" 
            class="avatar"
            :class="{ 'avatar-self': message.isSelf }"
          ></image>
          <view 
            class="message-content"
            :class="{ 'message-content-self': message.isSelf }"
          >
            <text class="message-text">{{ message.content }}</text>
            <text class="message-time">{{ message.time }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="input-area">
      <input 
        type="text" 
        v-model="inputMessage"
        class="message-input"
        placeholder="输入消息..."
        @confirm="sendMessage"
      />
      <button class="send-btn" @tap="sendMessage">发送</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      messages: [
        {
          content: '你好，请问这个商品还在吗？',
          time: '14:30',
          avatar: '/static/avatar/buyer.png',
          isSelf: false
        },
        {
          content: '在的，有什么问题吗？',
          time: '14:31',
          avatar: '/static/avatar/default.png',
          isSelf: true
        },
        {
          content: '可以便宜一点吗？',
          time: '14:32',
          avatar: '/static/avatar/buyer.png',
          isSelf: false
        },
        {
          content: '可以聊，你觉得多少合适？',
          time: '14:33',
          avatar: '/static/avatar/default.png',
          isSelf: true
        }
      ],
      inputMessage: '',
      scrollToMessage: '',
      userId: ''
    }
  },
  onLoad(options) {
    this.userId = options.userId
    // 滚动到最后一条消息
    this.scrollToBottom()
  },
  methods: {
    scrollToBottom() {
      this.scrollToMessage = 'msg-' + (this.messages.length - 1)
    },
    sendMessage() {
      if (!this.inputMessage.trim()) return

      const newMessage = {
        content: this.inputMessage,
        time: this.getCurrentTime(),
        avatar: '/static/avatar/default.png',
        isSelf: true
      }

      this.messages.push(newMessage)
      this.inputMessage = ''
      
      // 滚动到新消息
      this.$nextTick(() => {
        this.scrollToBottom()
      })
    },
    getCurrentTime() {
      const now = new Date()
      const hours = now.getHours().toString().padStart(2, '0')
      const minutes = now.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }
}
</script>

<style>
.chat {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-messages {
  flex: 1;
  padding: 20rpx;
}

.message-list {
  padding-bottom: 20rpx;
}

.message-item {
  display: flex;
  margin-bottom: 30rpx;
  align-items: flex-start;
}

.message-self {
  flex-direction: row-reverse;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin: 0 20rpx;
}

.message-content {
  max-width: 60%;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  position: relative;
}

.message-content-self {
  background: #95ec69;
}

.message-text {
  font-size: 28rpx;
  color: #333;
  word-break: break-all;
}

.message-time {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  display: block;
}

.input-area {
  padding: 20rpx;
  background: #fff;
  border-top: 1rpx solid #eee;
  display: flex;
  align-items: center;
}

.message-input {
  flex: 1;
  height: 80rpx;
  background: #f5f5f5;
  border-radius: 40rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  margin-right: 20rpx;
}

.send-btn {
  width: 120rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  background: #1296db;
  color: #fff;
  border-radius: 40rpx;
  font-size: 28rpx;
  padding: 0;
}
</style>