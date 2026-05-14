Page({
  data: {
    activePaper: '',
    activePaperLabel: ''
  },

  selectPaper(e) {
    const type = String(e.currentTarget.dataset.type || '');
    const label = e.currentTarget.dataset.label || type;
    if (!type) return;
    const currentActive = this.data.activePaper;

    if (currentActive === '') {
      this.setData({ activePaper: type, activePaperLabel: label });
    } else if (currentActive === type) {
      this.jumpToDetail(type);
    } else {
      this.setData({ activePaper: type, activePaperLabel: label });
    }
  },

  jumpToDetail(type) {
    wx.navigateTo({
      url: `/subpkg/Polaroid/CommonPaperList/CommonPaperList?type=${type}`
    });
  },

  resetAllPaper() {
    this.setData({ activePaper: '', activePaperLabel: '' });
  },

  onLoad(options) {
    console.log('PolaroidAllList', options);
  },

  onShow() {
    this.setData({ activePaper: '', activePaperLabel: '' });
  },

  onHide() {
    this.setData({ activePaper: '', activePaperLabel: '' });
  },

  onUnload() {
    this.setData({ activePaper: '', activePaperLabel: '' });
  }
});
