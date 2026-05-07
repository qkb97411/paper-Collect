// subpkg/FujiFilm/CommonPaperList/CommonPaperList.js
Page({
  data: {
    paperList: [],      // 通用相纸列表
    loading: true,      // 加载状态
    paperType: '',      // 传入的类型（mini/square/wide）
    paperTypeText: ''   // 类型对应的中文/展示文本
  },

  onLoad(options) {
    // 接收跳转时传入的类型参数
    const { type } = options;
    if (!type) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    // 映射类型对应的展示文本（可扩展多语言/自定义文案）
    const typeTextMap = {
      mini: 'mini',
      square: 'square',
      wide: 'Wide'
    };

    // 设置页面标题和类型
    this.setData({
      paperType: type,
      paperTypeText: typeTextMap[type] || type
    }, () => {
      // 数据更新后加载对应类型数据
      this.getPaperData();
    });

    // 动态设置导航栏标题
    wx.setNavigationBarTitle({
      title: `${typeTextMap[type]} 相纸图鉴`
    });
  },

  // 核心：根据paperType查询对应数据
  getPaperData() {
    const db = wx.cloud.database();

    db.collection("FujiConfig")
      .where({
        subType: this.data.paperType  // 动态使用传入的类型
      })
      .get()
      .then(res => {
        console.log(`✅ 获取 ${this.data.paperType} 相纸成功：`, res.data);
        this.setData({
          paperList: res.data,
          loading: false
        });
      })
      .catch(err => {
        console.error(`❌ 加载 ${this.data.paperType} 相纸失败：`, err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ paperList: [], loading: true });
    this.getPaperData().then(() => {
      wx.stopPullDownRefresh();
    });
  }
});