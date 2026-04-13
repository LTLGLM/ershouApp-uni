export default {
    onShow() {
        if (!uni.getStorageSync('token')) {
            let pages = getCurrentPages(); // 获取当前页面栈
            let currentPage = pages[pages.length - 1]; // 获取当前页面
            let currentPath = currentPage.route; // 获取当前页面路径

            uni.showModal({
                title: '登录提示',
                content: '您需要登录才能继续操作',
                confirmText: '立即登录',
                cancelText: '暂不登录',
                success: (res) => {
                    if (res.confirm) {
                        uni.navigateTo({
                            url: '/pages/login/login?back=' + encodeURIComponent(currentPath)
                        })
                    } else if (res.cancel) {
                        console.log(666);
                        
                        if (pages.length > 1) {
                            uni.navigateBack()
                        } else {
                            uni.reLaunch({
                                url: '/pages/index/index'
                            })
                        }
                    }
                }
            })
        }
    }
}
