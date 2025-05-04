// =============================== 脚本头部元信息 ===============================
// ==UserScript==
// @name         🌿📖 这才是简书
// @namespace    ricsy
// @version      1.0.0
// @description  自动生成响应式目录，支持清除广告、不相关内容，适配夜间模式
// @author       ricsy
// @match        http://www.jianshu.com/p/*
// @match        https://www.jianshu.com/p/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @grant        GM_addStyle
// ==/UserScript==

/* =============================== 样式配置常量 =============================== */
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

/* =============================== 核心功能模块 =============================== */
const TOCGenerator = (() => {
    // 标题起始索引
    let titleIndex = 1;
    // 目录标题
    const LocTitle =  "📖 内容导航";
    // 获取所有标题，包含一级标题到六级标题
    const $titles = $('article').find('h1,h2,h3,h4,h5,h6');
    if (!$titles.length) return;

    /* =============================== 工具函数 =============================== */
     // 防抖函数
    const debounce = (func, delay) => {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => func.apply(this, args), delay);
        };
    };

    /* =============================== 事件监听 =============================== */
    // 加载/调整大小/滚动时触发（严格模式）
    const optimizedScrollHandler = debounce(() => bindScrollEvents(true), 100);
    window.addEventListener('load', optimizedScrollHandler);
    window.addEventListener('resize', optimizedScrollHandler);
    window.addEventListener('scroll', optimizedScrollHandler);

    /* =============================== 初始化目录结构 =============================== */
    const initStructure = () => {
        // 文章容器
        const $article = $('article');
        if (!$article.length) {
            console.error('[TOC] 未找到文章容器 article');
            return false;
        }

        // 插入目录
        $article.prepend(`
            <div id="side-menu-loc"
                style="
                    position: fixed;                                     /* 固定定位 */
                    top: 100px;                                          /* 距离顶部的距离 */
                    right: calc(50% - 750px);                                      /* 距离右侧的距离 */
                    width: ${STYLE_CONFIG.menu.width};                   /* 宽度 */
                    background: ${STYLE_CONFIG.menu.background};         /* 背景颜色 */
                    z-index: ${STYLE_CONFIG.menu.zIndex};                /* 确保在其他元素之上 */
                    border-radius: ${STYLE_CONFIG.menu.borderRadius};    /* 圆角 */
                    border-left: 1px solid #ccc;                         /* 左边框 */
                    box-shadow: ${STYLE_CONFIG.menu.boxShadow};          /* 阴影 */
                    padding:15px 20px;                                   /* 内边距 */
                    line-height: 1.3;                                    /* 行高 */
                ">
                <h2
                    style="margin:0 0 8px;font-size:18px;">
                    ${LocTitle}
                </h2>
                <hr
                style="
                    height: ${STYLE_CONFIG.hr.height};                   /* 线条粗细 */
                    background: ${STYLE_CONFIG.hr.color};                /* 背景颜色 */
                    margin: 12px 0;                                      /* 上下边距 */
                    border: none;                                        /* 移除默认边框 */
                ">
                <ol id="menu_loc_ol" style="list-style:none; margin:0; padding:0;"></ol>
            </div>
        `);
        return true;
    };

    /* =============================== 生成目录项 =============================== */
    const generateItems = () => {
        // 创建文档片段（内存中的临时容器）
        const fragment = document.createDocumentFragment();
        $titles.each(function() {
            // 标题级别
            const level = parseInt(this.tagName.substring(1));
            // 标题内容
            let title = $(this).text();
            // 标题ID
            const titleId = `toc_${titleIndex++}`;
            // 为标题添加ID
            $(this).attr('id', titleId);

            let paddingLeft = (level - 1) * 20;
            // 一级标题增加左边距，美化悬浮显示效果
            if (level == 1) {
                paddingLeft = 10;
            }

            // 生成目录项
            const $li = $(`
                <li class="${titleId}"
                    style="
                        padding-left: ${paddingLeft}px;
                        margin:6px 0;
                        transition:all 0.2s;
                        cursor:pointer;
                    ">
                    ${title}
                </li>
            `);

            if (!title.includes(LocTitle)) {
                // 将原生 DOM 元素添加到片段
                fragment.appendChild($li[0]);
            }
        });

        // 一次性添加所有目录项到文档片段，避免频繁操作DOM
        $('#menu_loc_ol').append(fragment);
    };

    /* =============================== 绑定点击事件 =============================== */
    const bindClickEvents = () => {
        $('#menu_loc_ol').on('click', 'li', function() {
            // 获取目标元素
            const targetId = $(this).attr('class');
            const targetElement = $(`#${targetId}`)[0];

            // =============================== 处理页面滚动 ===============================
            // 多次点击同一目录项时，不做处理
            if (!targetElement) {
                return ;
            }
            // 计算滚动位置
            const elementHeight = targetElement.offsetHeight;
            const y = targetElement.getBoundingClientRect().top + window.pageYOffset - elementHeight - 10;

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
    };

    /* =============================== 绑定滚动事件 =============================== */
    const bindScrollEvents = (strictMode) => {
        let currentId = '';
        let minVisibleTop = Infinity;
        let maxInvisibleTop = -Infinity;
        let hiddenId = '';

        Array.from($titles).forEach(title => {
            const rect = title.getBoundingClientRect();
            const id = title.getAttribute('id');

            // 严格模式判断逻辑
            const isVisible = strictMode ?
                rect.top >= 10 && rect.bottom <= window.innerHeight :
                rect.top >= -rect.height;

            if (isVisible && rect.top < minVisibleTop) {
                minVisibleTop = rect.top;
                currentId = id;
            } else if (rect.top < 0 && rect.top > maxInvisibleTop) {
                maxInvisibleTop = rect.top;
                hiddenId = id;
            }
        });

        currentId = currentId || hiddenId;

        const tocLinks = document.querySelectorAll('#menu_loc_ol li');
        // 更新激活状态
        tocLinks.forEach(link => {
            const classList = link.className || '';
            const firstClass = classList.split(/\s+/)[0] || '';
            link.classList.toggle('active', firstClass === currentId);
        });
    };

    /* =============================== 广告移除模块 =============================== */
    const removeAds = () => {
        const AsideClassName = $('aside').attr('class');
        if (!AsideClassName) {
            console.error("[loc] 没有找到广告容器 aside 的 class 属性");
            return false;
        }
        const AsideSelector = '.' + AsideClassName.split(' ').join('.')
        $(AsideSelector).css('display','none');

        // 获取文章容器 article 的父级元素
        const $articleParent = $('article').parent();
        // 隐藏 article 父级元素的所有同级节点
        $articleParent.siblings().hide();
    };

    return {
        init: () => {
            if (!initStructure()) return;
            generateItems();
            bindClickEvents();
            removeAds();
        }
    };
})();


/* =============================== 样式管理模块 =============================== */
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
        #side-menu-loc h2 {
            color: #e0e0e0 !important;
        }
        #menu_loc_ol li.active {
            background: #88969f;
        }
        #menu_loc_ol li:hover {
            background: #a4c99e;
            color: #000000;
        }
    }
    /* 响应式处理 */
    @media (max-width: 1600px) {
        #side-menu-loc {
            display: none;
        }
    }
`);

/* =============================== 主执行流程 =============================== */
(() => {
    'use strict';
    try {
        console.log("[loc] ⏳ 开始生成目录...");
        TOCGenerator.init();
        console.log('[TOC] 🎉 目录生成完成，请尽情享受吧！');
    } catch (error) {
        console.error('[TOC] 💥 初始化失败:', error);
    }
})();