// subpkg/FujiFilm/FujiAllList/FujiAllList.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    activePaper: '', // 当前选中的相纸
  },

  // 点击相纸：选中并弹出
  selectPaper(e) {
    const type = e.currentTarget.dataset.type;
    const currentActive = this.data.activePaper;

    // 情况1：当前没有弹出 → 第一次点击：弹出
    if (currentActive === '') {
      this.setData({
        activePaper: type
      });
    }
    // 情况2：当前已经弹出，且点击的是同一张 → 第二次点击：跳转图鉴
    else if (currentActive === type) {
      this.jumpToDetail(type);
    }
    // 情况3：切换点击其他相纸 → 切换弹出
    else {
      this.setData({
        activePaper: type
      });
    }
  },

  // 跳转对应图鉴页面（核心！）
  jumpToDetail(type) {
    // 跳转通用页面，并传入类型参数
    wx.navigateTo({
      url: `/subpkg/FujiFilm/CommonPaperList/CommonPaperList?type=${type}`,
    });
  },

  // 点击空白处 还原所有相纸
  resetAllPaper() {
    this.setData({
      activePaper: ''
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log("分包页面加载成功！", options);
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
    this.setData({ activePaper: '' });  // 兜底：返回时也重置
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.setData({ activePaper: '' }); // 重置选中状态
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    this.setData({ activePaper: '' }); // 重置选中状态
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

  }
})