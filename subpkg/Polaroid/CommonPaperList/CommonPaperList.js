Page({
  data: {
    paperList: [],
    loading: true,
    paperType: '',
    paperTypeText: ''
  },

  onLoad(options) {
    const { type } = options;
    if (!type) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      wx.navigateBack();
      return;
    }

    const typeTextMap = {
      wide: 'Wide',
      '600': '600 / i-Type',
      go: 'Go',
      mini: 'Go',
      itype: '600 / i-Type',
      iType: '600 / i-Type',
      'i-Type': '600 / i-Type',
      square: '600 / i-Type'
    };

    this.setData(
      {
        paperType: type,
        paperTypeText: typeTextMap[type] || type
      },
      () => {
        this.getPaperData();
      }
    );

    wx.setNavigationBarTitle({
      title: `${typeTextMap[type] || type} · 宝丽来`
    });
  },

  getPaperData() {
    if (!wx.cloud.database()) {
      this.setData({ loading: false });
      wx.showToast({ title: '云服务未初始化', icon: 'none' });
      return Promise.resolve();
    }

    const db = wx.cloud.database();
    const _ = db.command;
    const typeAliasMap = {
      wide: ['wide'],
      '600': ['600', 'itype', 'iType', 'i-Type', 'square'],
      itype: ['600', 'itype', 'iType', 'i-Type', 'square'],
      go: ['go', 'mini']
    };
    const types = typeAliasMap[this.data.paperType] || [this.data.paperType];
    this.setData({ loading: true });

    return db
      .collection('PolaroidConfig')
      .where({
        subType: _.in(types)
      })
      .get()
      .then((res) => {
        this.setData({
          paperList: res.data,
          loading: false
        });
      })
      .catch((err) => {
        console.error('Polaroid 列表加载失败', err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      });
  },

  gotoDetail(e) {
    const paperId = e.currentTarget.dataset.id;
    if (!paperId) {
      wx.showToast({ title: '相纸ID异常', icon: 'none' });
      return;
    }
    wx.navigateTo({
      url: `/subpkg/Polaroid/PaperDetail/PaperDetail?id=${paperId}`,
      fail: (err) => {
        console.error('跳转 PaperDetail 失败', err);
        wx.showToast({ title: '详情页加载失败', icon: 'none' });
      }
    });
  },

  onPullDownRefresh() {
    this.setData({ paperList: [], loading: true });
    this.getPaperData().finally(() => {
      wx.stopPullDownRefresh();
    });
  }
});
