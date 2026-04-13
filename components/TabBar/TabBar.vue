<template>
  <div>
    <u-tabbar
      :value="active"
      @change="onChange"
      :border="true"
      :fixed="true"
      :placeholder="false"
      :safeAreaInsetBottom="false"
    >
      <u-tabbar-item
        :key="index"
        v-for="(item, index) in tabbarList"
        :text="item.name"
        :icon="item.icon"
        @click="click1"
      ></u-tabbar-item>
    </u-tabbar>
  </div>
</template>

<script>
export default {
  props: {
    current: {
      type: Number,
      default: 0,
    },
  },
  data() {
    return {
      active: 0,
      tabbarList: [
        {
          name: "首页",
          icon: "home",
          url: "/pages/index/index",
        },
        {
          name: "消息",
          icon: "chat",
          url: "/pages/message/message",
        },
        {
          name: "发布",
          icon: "plus-circle",
          url: "/pages/release/release",
        },
        {
          name: "购物车",
          icon: "shopping-cart",
          url: "/pages/cart/cart",
        },
        {
          name: "我的",
          icon: "account",
          url: "/pages/my/my",
        },
      ],
    };
  },
  methods: {
    onChange(event) {
      uni.switchTab({
        url: this.tabbarList[event].url,
      });
    },
    click1(event) {
      uni.switchTab({
        url: this.tabbarList[event].url,
      });
    },
    updateCurrent(index) {
      this.active = index;
    },
  },
};
</script>

<style lang="scss" scoped>
</style>