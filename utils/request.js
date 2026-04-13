const BASE_URL = 'http://localhost:8089'

export const request = ({
	url,
	method = 'GET',
	data = {}
}) => {
	return new Promise((resolve, reject) => {
		uni.request({
			url: BASE_URL + url,
			method,
			data,
			header: {
				'token': `${uni.getStorageSync('token') || ''}`,
				'Content-Type': 'application/json'
			},
			success: res => {
				const {
					statusCode,
					data
				} = res;

				if (statusCode === 200) {
					resolve(data)
				} else if (statusCode === 401) {
					uni.showModal({
						title: '登录过期',
						content: '您的登录信息已过期，需要重新登录',
						confirmText: '去登录',
						cancelText: '取消',
						success: modalRes => {
							if (modalRes.confirm) {
								uni.removeStorageSync('token'); // 清除 token
								uni.reLaunch({
									url: '/pages/login/login'
								}); // 跳转到登录页
							}
						}
					});
					reject(new Error('未授权，请重新登录'));
				} else if (statusCode === 404) {
					uni.showToast({
						title: '请求的资源不存在',
						icon: 'none'
					});
					reject(new Error('资源未找到'));
				} else {
					uni.showToast({
						title: data.message || '请求失败，请稍后重试',
						icon: 'none'
					});
					reject(new Error(data.message || '请求失败'));
				}
			},
			fail: err => reject(err)
		})
	})
}