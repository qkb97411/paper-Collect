Component({
  properties: {
    checked: { type: Boolean, value: false },
    leftText: { type: String, value: "ON" },
    rightText: { type: String, value: "OFF" },
    /** 可选：用于列表项，区分是哪一行触发的 change */
    boxIndex: { type: Number, value: -1 }
  },
  methods: {
    toggleSwitch() {
      const newChecked = !this.data.checked
      this.setData({ checked: newChecked })
      this.triggerEvent("change", {
        checked: newChecked,
        boxIndex: this.properties.boxIndex
      })
    }
  }
})