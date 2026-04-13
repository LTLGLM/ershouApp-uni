import WebSocketService from "@/utils/websocket"

const websocket = {
    state: {
        websocketClient: null,
    },
    mutations: {
        SET_WEBSOCKET_CLIENT(state, websocketClient) {
            state.websocketClient = websocketClient
        },
    },
    actions: {
        initWebSocketClient({ commit, state }, namespace) {

            const ws = new WebSocketService(namespace);
            ws.connect();

            commit("SET_WEBSOCKET_CLIENT", ws);
        },
    }
}

export default websocket