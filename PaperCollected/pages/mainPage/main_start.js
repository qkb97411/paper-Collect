// pages/mainPage/main_start.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    config: [
      {
        image: "https://636c-cloud1-d1gwt1b3t500f1304-1428922499.tcb.qcloud.la/banner/banner.jpg",
        name: "上传者By：不知名玩家",
        desc: "记录每一个美好生活瞬间"
      },
    ], 
    // 默认选中第一个标签
    currentTab: -1,
    currentData: {}
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 默认显示配置内容
    this.setData({
      currentData: this.data.config[0]
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  // 切换标签
  switchTab(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ currentTab: tab });
    // 🔥 注意路径！分包写法！
    if (tab === 0) {
      wx.navigateTo({
        url: "/subpkg/FujiFilm/FujiAllList/FujiAllList",
        success: () => {
          console.log("跳转分包成功");
        },
        fail: (err) => {
          console.error("跳转失败：", err); // 增加错误日志，方便排查
        }
      });
    }
    if (tab === 1) {
      wx.showToast({title: "Polaroid页面待开发", icon: "none"});
    }
    if (tab === 2) {
      wx.showToast({title: "我的页面待开发", icon: "none"});
    }
  }
})