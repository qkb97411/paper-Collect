// 云函数 login/index.js
const cloud = require('wx-server-sdk')

// 固定写法，不用改任何配置
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 主函数，必须加 async
exports.main = async (event, context) => {
  // 获取微信上下文
  const wxContext = cloud.getWXContext()

  // 强行打印日志 + 返回数据
  console.log("===== 云函数执行成功 =====")
  console.log("OPENID:", wxContext.OPENID)

  // openid 必有；unionid 需小程序绑定微信开放平台且用户已授权同主体应用后才可能有值
  return {
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID || ''
  }
}