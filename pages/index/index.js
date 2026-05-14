// index.js
Page({
  data: {
    canIUseGetUserProfile: true
  },

  onLoad() {
    // 自动检查登录
    this.checkLogin();
  },

  checkLogin() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      this.goToMain();
    }
  },

  // 微信登录
  getUserProfile() {
    wx.getUserProfile({
      desc: '用于登录',
      success: (res) => {
        console.log("登录成功", res);
        
        // 保存用户信息
        wx.setStorageSync('userInfo', res.userInfo);

        // ✅ 修复在这里：用 navigateTo 普通跳转，一定能成功
        wx.navigateTo({
          url: '/pages/mainPage/main_start',
        })
      },
      fail: () => {
        wx.showToast({
          title: '取消登录',
          icon: 'none'
        })
      }
    })
  },

  // 已登录直接跳转
  goToMain() {
    wx.navigateTo({
      url: '/pages/mainPage/main_start',
    })
  }
});