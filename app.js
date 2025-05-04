// ==UserScript==
// =============================== 脚本头部元信息 ===============================
// @name         简书智能目录生成器
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  自动生成响应式目录，支持夜间模式适配
// @author       ricsy
// @match        http://www.jianshu.com/p/*
// @match        https://www.jianshu.com/p/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @grant        GM_addStyle
// ==/UserScript==

/* 样式配置常量 */
const STYLE_CONFIG = {
    // 目录样式
    menu: {
        width: '230px',
        background: '#f9f9f9',
        zIndex: 99999,
        borderRadius: '8px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
    },
    // 分割线样式
    hr: {
        height: '2px',
        color: '#c7254e'
    },
    // 目录项样式
    listItem: {
        fontSize: '15px',
        hoverTransform: 'translateX(5px)' /* 平滑位移动画，向右移动5px */
    }
};

// 标题起始索引
var titleIndex = 1;

// 在侧边栏中添加目录项
function appendMenuItem(level, id, title){
        let paddingLeft = (level - 1) * 20;
        // 一级标题增加左边距，美化悬浮显示效果
        if (level == 1) {
            paddingLeft = 10;
        }
        $('#menu_loc_ol').append(`
            <li
                class="${id}"
                style="padding-left: ${paddingLeft}px;"
            >
                ${title}
            </li>
        `);
    }

(function() {
    'use strict';
    console.log("[loc] ⏳ 开始生成目录...");
    // 如果没有文章，直接返回
    if ($('article').length == 0) {
        console.error("[loc] 没有找到 article 元素");
        return;
    }

    // 获取所有标题，包含一级标题到六级标题
    let titles = $('article').find('h1,h2,h3,h4,h5,h6');
    // 如果没有标题，直接返回
    if (titles.length == 0) {
        return;
    }

    // =============================== 插入目录元素 ===============================
    // 获取文章的类名
    const ArticleClassName = $('article').attr('class');
    // 将类名转为有效选择器
    if (!ArticleClassName) {
        console.error("[loc] 没有找到 article 元素的 class 属性");
        return;
    }
    const articleSelector = '.' + ArticleClassName.split(' ').join('.')
    // 开始插入使用反引号（`）定义多行字符串，避免单行过长
    $(articleSelector).prepend(`
        <div
            id="side-menu-loc"
            style="
                position:fixed;                                     /* 固定定位 */
                top:100px;                                          /* 距离顶部的距离 */
                right:100px;                                        /* 距离右侧的距离 */
                width:${STYLE_CONFIG.menu.width};                   /* 宽度 */
                background:${STYLE_CONFIG.menu.background};         /* 背景颜色 */
                z-index:${STYLE_CONFIG.menu.zIndex};                /* 确保在其他元素之上 */
                border-radius:${STYLE_CONFIG.menu.borderRadius};    /* 圆角 */
                border-left: 1px solid #ccc;                        /* 左边框 */
                box-shadow:${STYLE_CONFIG.menu.boxShadow};          /* 阴影 */
                padding:15px 20px;                                  /* 内边距 */
                line-height: 1.3;                                   /* 行高 */
            "
        >
            <h2
                style="margin:0 0 8px;font-size:18px;">
                📖 内容导航
            </h2>
            <hr
                style="
                    height:${STYLE_CONFIG.hr.height};                /* 线条粗细 */
                    background:${STYLE_CONFIG.hr.color};             /* 背景颜色 */
                    margin:12px 0;                                   /* 上下边距 */
                    border:none;                                     /* 移除默认边框 */
                "
            >
        </div>
    `);
    // 插入 ol 元素，不包含 ol 结束标签
    $('#side-menu-loc').append(`
        <ol
            id="menu_loc_ol"
            style="
                list-style: none; // 移除默认的点样式
                margin: 0px;      // 移除默认的外边距
                padding: 0px;     // 移除默认的内边距
            "
        >
    `);

    // =============================== 生成目录内容 ===============================
    // 开始生成
    titles.each(function() {
        // 获取标题的层级
        let level = parseInt(this.tagName.substring(1));
        let title = $(this).text();
        // id 全部重新生成, 避免重复
        let titleId = "id_" + titleIndex++;
        $(this).attr('id', titleId);
        appendMenuItem(level, titleId, title);
    })
    // 添加 ol 结束标签
    $('#side-menu-loc').append('</ol>');

    // =============================== 绑定点击事件 ===============================
    // 绑定目录 li 点击事件,实现点击跳转到对应位置
    $('#menu_loc_ol li').on('click',function(){
        // 获取目标元素
        let targetId = $(this).attr('class');
        const targetElement = $("#"+targetId)[0];

        // =============================== 处理页面滚动 ===============================
        // 计算滚动位置
        const elementHeight = targetElement.offsetHeight + 10;
        const y = targetElement.getBoundingClientRect().top + window.pageYOffset - elementHeight;

        // 滚动到目标位置
        window.scrollTo({
            top: y,
            behavior: 'smooth'
        });

        // =============================== 处理点击状态 ===============================
        // 清除所有元素点击状态
        $('#menu_loc_ol li').removeClass('active');
        // 设置当前元素点击状态
        $(this).addClass('active');
    });

    console.log("[loc] 🎉 生成成功，请尽情享受吧！");

    // =============================== 删除右侧广告 ===============================
    const AsideClassName = $('aside').attr('class');
    if (!AsideClassName) {
        console.error("[loc] 没有找到 aside 元素的 class 属性");
        return;
    }
    const AsideSelector = '.' + AsideClassName.split(' ').join('.')
    $(AsideSelector).css('display','none');
})()


/* 样式管理模块 */
GM_addStyle(`
    #menu_loc_ol li {
        font-size: ${STYLE_CONFIG.listItem.fontSize};           /* 字体大小 */
        cursor: pointer;                                        /* 鼠标悬停时的光标样式 */
        transition: all 0.2s;                                   /* 过渡效果 */
        border-radius: 4px;                                     /* 圆角 */
        padding-top: 4px;                                       /* 上边距 */
        padding-bottom: 4px;                                    /* 下边距 */
    }
    #menu_loc_ol li:hover {
        background: #e7b948;                                    /* 悬停时的背景颜色 */
        text-decoration: underline;                             /* 悬停时添加下划线 */
        transform: ${STYLE_CONFIG.listItem.hoverTransform};     /* 悬停时的动画效果 */
    }
    #menu_loc_ol li.active {
        color: #1902c0;                                         /* 点击时的文字颜色 */
        font-weight: 500;                                       /* 加粗显示 */
        background: #e8f0fe;                                    /* 点击时的背景颜色 */
    }
    @media (prefers-color-scheme: dark) {                       /* 深色模式 */
        #side-menu-loc {
            background: #2d2d2d !important;
            color: #e0e0e0;
        }
        #menu_loc_ol li:hover {
            background: #3d3d3d;
        }
    }
`);