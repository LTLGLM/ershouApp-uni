class WebSocketService {
    constructor(namespace) {
        this.namespace = namespace || "";
        this.socketTask = null;
        this.pingInterval = 30000;
        this.reconnectInterval = 5000;
        this.reconnectAttempts = 0;
        this.pingTimer = null;
        this.eventCallbacks = {};
    }

    connect() {
        if (this.socketTask) {
            return;
        }

        const token = uni.getStorageSync("token");
        const url = this.namespace ? `ws://localhost:8089/${this.namespace}` : `ws://localhost:8089`;
        const fullUrl = token ? `${url}?token=${token}` : url;

        this.socketTask = uni.connectSocket({
            url: fullUrl,
            success: () => {
                console.log("WebSocket 连接请求已发送");
            },
            fail: (err) => {
                console.error("WebSocket 连接请求失败:", err);
            }
        });

        uni.onSocketOpen(() => {
            console.log("WebSocket 已连接");
            this.reconnectAttempts = 0;
            this.startHeartbeat();
        });

        uni.onSocketMessage((event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type && this.eventCallbacks[data.type]) {
                    this.eventCallbacks[data.type].forEach((callback) => {
                        if (typeof callback === 'function') {
                            callback(data);
                        } else {
                            console.error('无效的回调函数，跳过执行:', callback);
                        }
                    });
                } else {
                    console.warn("未匹配到的 WebSocket 事件类型：", data);
                }
            } catch (error) {
                console.error("WebSocket 消息解析失败:", error);
            }
        });

        uni.onSocketClose(() => {
            console.log("WebSocket 断开");
            this.stopHeartbeat();
            this.reconnect();
        });

        uni.onSocketError((error) => {
            console.error("WebSocket 错误:", error);
        });
    }

    sendMessage(event, message) {
        if (this.socketTask) {
            this.socketTask.send({
                data: JSON.stringify({ event, message })
            });
        } else {
            console.error("WebSocket 未连接，消息发送失败");
        }
    }

    on(event, callback) {
        if (typeof callback !== 'function') {
            console.error('传入的回调必须是一个函数');
            return;
        }
        if (!this.eventCallbacks[event]) {
            this.eventCallbacks[event] = [];
        }
        this.eventCallbacks[event].push(callback);
    }

    disconnect() {
        if (this.socketTask) {
            this.socketTask.close();
            this.socketTask = null;
            this.stopHeartbeat();
            console.log("WebSocket 已断开");
        }
    }

    startHeartbeat() {
        this.pingTimer = setInterval(() => {
            if (this.socketTask) {
                this.socketTask.send({
                    data: JSON.stringify({ event: "ping" })
                });
            }
        }, this.pingInterval);
    }

    stopHeartbeat() {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
    }

    reconnect() {
        this.reconnectAttempts++;
        console.log(`尝试重连 WebSocket (${this.reconnectAttempts}次)`);
        setTimeout(() => this.connect(), this.reconnectInterval);
    }
}

export default WebSocketService;