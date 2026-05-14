# 项目描述
- 本项目是一款相纸收集图鉴小程序
- 小程序主页功能包括主图展示、Fujifilm分页签、Polaroid分页签、我的分页签
- 小程序的分页签中间跳转页功能是展示当前页签下所有类型相纸的尺寸，以及跳转对应类型列表页
- 小程序的对应类型列表页功能是读取远端云服务下配置数据，展示当前配置下所有相纸图鉴，以及打开对应相纸详情页
- 小程序的对应相纸详情页功能是读取远端云服务下配置数据，展示当前配置下相纸详情，以及用户主动修改信息并存储
- 小程序用户可以在对应相纸详情页编辑的功能有:相纸是否拥有，拥有数量修改，每一盒相纸的价格、日期(xxxx-xx格式)、编号、是否已使用Toggle


## 关键入口
- 项目主页 pages/mainPage/main_start

## FujiFilm页签(已实现)
- 富士相纸云服务数据存储集合:FujiConfig
- 富士相纸专题目录页:FujiFilm/FujiAllList/FujiAllList
- 富士相纸通用类型列表展示页:FujiFilm/CommonPaperList/CommonPaperList
- 富士相纸详情展示页:FujiFilm/PaperDetail/PaperDetail

## Polaroid页签(已实现)
- 宝丽来相纸云服务数据存储集合:PolaroidConfig
- 宝丽来相纸专题目录页:Polaroid/PolaroidAllList/PolaroidAllList
- 宝丽来相纸通用类型列表展示页:Polaroid/CommonPaperList/CommonPaperList
- 宝丽来相纸详情展示页:Polaroid/PaperDetail/PaperDetail

## 我的页签(已实现)
- 我的分页签:Mine/MyHome/MyHome
- 展示头像和用户名
- 支持类型筛选，一级筛选为All、FujiFilm和Polaroid三项
- 支持类型筛选，二级筛选为该类型对应云服务Config集合下subType类型的数量，命名是subType字段的值
- 用户未筛选：
- 1.一级页签选中All
- 2.展示我的相纸总花费(通过玩家每款相纸设置的购买价格获取总和)
- 3.展示我的相纸总库存(通过玩家每款相纸设置的拥有数量获取总和)
- 用户筛选后：
- 1.展示对应筛选类型
- 2.展示对应筛选类型下相纸总花费
- 3.展示对应筛选类型下相纸总库存

## 云函数
- 登录:cloudfunctions/login
- 获取远端用户数据:cloudfunctions/getPlayerProfile
- 设置远端用户数据:cloudfunctions/setPlayerProfile

## 版本迭代以及需求补充
- 暂无版本迭代

