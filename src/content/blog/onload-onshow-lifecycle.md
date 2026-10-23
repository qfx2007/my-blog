---
title: 'onLoad / onShow 触发时机与页面生命周期差异'
description: '整理小程序中 onLoad、onShow、onHide、onUnload 的触发时机，以及 tabBar 页面与普通非 tab 页面的生命周期差异和跳转方式对页面栈的影响。'
date: '2026-10-01'
draft: false
tags:
  - 小程序
  - uni-app
  - 生命周期
  - onLoad
  - onShow
categories:
  - 笔记
series:
  - 前端
comments: true
sidebar:
  enable: true
  toc: true
  relatedPosts: true
---

理解 `onLoad`、`onShow` 以及配套的反向生命周期，可以帮你判断页面何时初始化、何时可见、何时销毁，从而避免重复请求和不必要的状态残留。

## onLoad、onShow

