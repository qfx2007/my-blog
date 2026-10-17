---
title: 电商前端项目
description: '一个面向移动端的 Vue 2 电商前端项目，覆盖商品展示、购物车、用户登录、订单结算等核心电商链路。'
date: '2025-02-01T00:00:00+08:00'
icon: rocket
iconColor: '#e07a5f'
images:
  - ../../assets/figure/shopping-mall01.png
  - ../../assets/figure/shopping-mall02.png
tags:
  - Vue 2
  - E-commerce
  - Mobile
  - Vant
authors:
  - name: Q
links:
  - label: GitHub
    href: https://github.com
    kind: github
---


Shopping Mall 是一个面向移动端的电商项目，参考 B 站黑马程序员商城课程实现。项目完整覆盖了电商核心链路：首页商品展示与分类浏览、商品详情、购物车增删改查、用户登录与鉴权、订单结算等模块，并基于真实后端接口完成前后端联调。

项目仓库地址：[gitee.com/qu-fangxiang/shopping-mall](https://gitee.com/qu-fangxiang/shopping-mall)

## 为什么做这个项目

2025 年初学习阶段编写，目的是锻炼前端工程化能力与团队协作规范。通过一个完整的电商业务场景，系统练习 Vue 2 技术栈的实际应用，以及移动端适配、状态管理、请求封装、路由鉴权等常见业务场景的实现思路。

## 核心能力

- 首页商品展示、分类浏览与搜索
- 商品详情页（动态路由传参）
- 购物车增删改查与数量步进器
- 用户登录与 token 鉴权
- 我的订单与订单支付页面
- 移动端 vw 适配（PostCSS + px-to-viewport）

## 技术结构

```bash
src/
  api/                按业务模块拆分的 Axios 接口定义
  assets/             图片、样式资源
  components/         公共组件（商品卡片、数量步进器等）
  mixins/             Vue Mixins
  router/             路由配置与全局导航守卫
  store/              Vuex 状态管理（模块化）
  styles/             全局样式与 Less 变量
  utils/              工具函数
  views/              页面组件
    layout/           布局页（首页/分类/购物车/个人中心）
    login/            登录页
    prodetail/        商品详情页
    search/           搜索页
    myorder/          订单页
    pay/              支付页
  App.vue             根组件
  main.js             入口文件
工程化实践
- 移动端适配：PostCSS + px-to-viewport，自动将 px 转换为 vw
- 状态管理：Vuex 按模块拆分，购物车数据与 localStorage 持久化同步
- 路由鉴权：全局前置守卫拦截未登录用户访问订单、支付页面
- 请求封装：Axios 统一实例，按业务模块拆分接口文件
- 组件化：Vant 2 组件库 + 公共组件抽取 + Less 变量统一主题
技术栈
- Vue 2.6 + Vue CLI 5
- Vue Router 3
- Vuex 3
- Vant 2
- Axios
- Less + PostCSS
- ESLint
适合用在什么地方
- 学习 Vue 2 电商开发的完整业务场景
- 了解移动端 vw 适配方案
- 参考 Vuex 模块化状态管理实践
- 参考 Axios 请求层封装与路由鉴权实现
后续可以扩展什么
- 接入真实后端替换课程接口
- 增加商品收藏、优惠券等电商功能
- 迁移到 Vue 3 + Vite
- 增加单元测试和 E2E 测试
