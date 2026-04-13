import App from './App'
import store from './store';

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false

import uView from 'uview-ui'
import ProductList from '@/components/ProductList.vue'  // 确保路径正确
import TabBar from '@/components/TabBar/TabBar.vue'

Vue.use(uView)
Vue.component('ProductList', ProductList)  // Vue 2 注册全局组件
Vue.component('TabBar', TabBar)  // 全局注册TabBar组件

const app = new Vue({
  ...App,
  store
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import uView from 'uview-ui'
import store from './store';

export function createApp() {
  const app = createSSRApp(App)
  app.use(uView)  // Vue 3 需要 use uView
  app.component('ProductList', ProductList)  // Vue 3 注册全局组件
  app.use(store);
  return {
    app
  }
}
// #endif
