import Vue from 'vue';
import Vuex from 'vuex';
import websocket from './module/websocket';
import getters from './getters';

Vue.use(Vuex);

const store = new Vuex.Store({
    state: {
        // 这里可以定义初始状态
    },
    mutations: {
        // 这里可以定义修改状态的方法
    },
    actions: {
        // 这里可以定义异步操作
    },
    getters,
    modules: {
        websocket
    }
});

export default store;