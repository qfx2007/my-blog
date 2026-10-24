---
title: '页面栈与压栈出栈机制'
description: '整理微信小程序 / uni-app 中页面栈的基本概念、压栈出栈流程，以及它与传统网页浏览器历史记录管理的差异。'
date: '2026-10-15T00:00:00+08:00'
draft: true
tags:
  - 小程序
  - uni-app
  - 页面栈
  - 路由
categories:
  - 前端开发
series:
  - 小程序基础
comments: true
sidebar:
  enable: true
  toc: true
  relatedPosts: true
---





## 折腾到底：一眼相中 Astro 与 navfolio

先想清楚要一个什么样的博客：静态还是动态？纯手搓还是找个喜欢的框架？需要哪些技术栈？服务器配置够不够、要不要再买？域名怎么买……一系列问题慢慢考虑。

找主题框架的时候，我一眼就相中了 [navfolio](https://github.com/dodolalorc/astro-navfolio)——基础功能跟我的需求相似，尤其是主题风格我真的很喜欢，Vibe、blog 的页面布局直接狠狠相中。

本站基于 [Astro](https://astro.build) 构建，从 [navfolio](https://github.com/dodolalorc/astro-navfolio) 开源模板起步，代码已全部 vendor 到本地，由我独立维护和修改，随我的想法持续演进。内容全是纯文本，版本由 Git 管理；搜索用的是 Pagefind 静态索引；部署交给 Cloudflare。

好不容易把东西稍微部署起来，又要调成自己的样子：改功能、加功能、打磨内容……确实花了不少精力。中间踩坑无数，但也正是在这个过程中学到了很多：比如用 Axios 统一实例封装请求、按业务模块拆分接口文件；引入 Vant 2 组件库，并学会查找和使用阿里云图标库；熟悉 npm/yarn/pnpm 包管理器；上手状态管理乃至本地持久化；用 PostCSS 做移动端 vw 适配；用 ESLint 做代码检查等等。

但就这么一步步搭出来了。终于。


