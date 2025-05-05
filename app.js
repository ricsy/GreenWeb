// ==UserScript==
// @name         🌿 做个绿色网站
// @namespace    https://github.com/ricsy/GreenWeb
// @version      1.0.2
// @license      MIT
// @description  自动生成响应式目录，支持清除广告、不相关内容，适配夜间模式
// @author       ricsy
// @match        *://blog.csdn.net/*/article/details/*
// @match        *://zhuanlan.zhihu.com/p/*
// @match        *://www.jianshu.com/p/*
// @match        *://www.baidu.com/*
// @icon         none
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @grant        GM_addStyle
// ==/UserScript==

/* =============================== 全局变量 =============================== */
const hostname = window.location.hostname;

/* =============================== 全局错误监听 =============================== */
window.addEventListener('error', (e) => {
    console.error(`全局异常 ${e.message} @${e.filename}:${e.lineno}`);
});

// =============================== 日志类 ===============================
const Logger = (() => {

    const Styles = {
        info: 'color: #4CAF50; font-weight: 600; background: #f8fff8; padding: 2px 4px; border-radius: 3px;',
        warn: 'color: #FF9800; font-weight: 600; background: #fff8f0; padding: 2px 4px; border-radius: 3px;',
        error: 'color: #F44336; font-weight: 700; background: #fff0f0; padding: 2px 4px; border-radius: 3px;',
        debug: 'color: #000000; font-weight: 600; background: #fff0f0; padding: 2px 4px; border-radius: 3px;',

        primary: 'color: #007acc; font-weight: 600; background: #f8fff8; padding: 2px 4px; border-radius: 3px;',
      };

    let _prefix = "";

    const formatMessage = (level, message) => {
        let time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        if (_prefix.length == 0){
            return `%c[${time}] [${level.toUpperCase()}] ${message}`;
        } else {
            return `%c[${time}] [${level.toUpperCase()}] [${_prefix}] ${message}`;
        }
    };

    return {
        setPrefix: (newPrefix) => {
            if (typeof newPrefix === 'string') {
                _prefix = newPrefix;
            } else {
                console.warn('Prefix 必须是字符串类型');
            }
        },

        simple: (message) => {
            console.log(message);
        },
        ok: (message) => {
            console.debug(message);
        },

        primary: (message) => {
            console.log(formatMessage('step', message), Styles['primary']);
        },

        info: (message) => {
            console.log(formatMessage('info', message), Styles['info']);
        },
        warn: (message) => {
            console.log(formatMessage('warn', message), Styles['warn']);
        },
        error: (message) => {
            console.log(formatMessage('error', message), Styles['error']);
        },
        debug: (message) => {
            console.debug(formatMessage('debug', message), Styles['debug']);
        }
    }
})();
Logger.setPrefix("GreenWeb");

/* =============================== 自定义元素 =============================== */
const customElement = (() => {
    const CONFIG = {
        "toc" : {
            '#side-menu-toc': {
                name_zh: '自定义目录',
                selector_type: 'id',
                name_en: 'side-menu-toc',
                type: 'custom',
                hide: false,
            },
            '#menu_toc_ol': {
                name_zh: '目录列表',
                selector_type: 'id',
                name_en:'menu_toc_ol',
                type: 'custom',
                hide: false,
                show_filter: false,
            },
        },
        "ad": {
            '#ad-control': {
                name_zh: '广告控制栏',
                selector_type: 'id',
                name_en:'ad-control',
                type: 'custom',
                hide: false,
                show_filter: false,
            },
        }
    };
    return {
        getAllSelectors: () => {
            let result = [];

            for (const [sort, configData] of Object.entries(CONFIG)) {
                for (const [selector, config] of Object.entries(configData)) {
                    result.push({
                        name_zh: config.name_zh,
                        name_en: config?.name_en || selector,
                        selector: selector,
                        selector_type: config?.selector_type,
                        hide: config?.hide ?? false,
                        clear_child_styles: config?.clear_child_styles ?? false,
                        show_filter: config?.show_filter ?? true,
                        type: config?.type || 'custom',
                        dynamic: config?.dynamic ?? false,
                        change: config?.change ?? false,
                        change_info: config?.change_info || {},
                    });
                }
            }
            return result;
        },
        // 根据中文名称查询
        getSelector: (sort, name_zh) => {
            let result = {};
            for (const [selector, config] of Object.entries(CONFIG[sort])) {
                const zhName = typeof config === 'object'? config.name_zh : config;
                if (zhName === name_zh) {
                    return {
                        name_zh: config.name_zh,
                        name_en: config?.name_en || selector,
                        selector: selector,
                        selector_type: config?.selector_type,
                        hide: config?.hide ?? false,
                        clear_child_styles: config?.clear_child_styles ?? false,
                        show_filter: config?.show_filter ?? true,
                        type: config?.type || 'custom',
                        dynamic: config?.dynamic ?? false,
                        change: config?.change ?? false,
                        change_info: config?.change_info || {},
                    };
                }
            }
            return result;
        },
    }
}
)();

/* =============================== 元素标签 =============================== */
const elementTag = (() => {
    const CONFIG = {
        'blog.csdn.net': {
            'article': {
                name_zh: '文章',
                hide: false,
                show_filter: false,
            },
        },
        'zhuanlan.zhihu.com': {
        },
        'www.jianshu.com': {
            'article': {
                name_en: 'article',
                name_zh: '文章',
                hide: false,
                hide_parent_siblings: true, // 隐藏相邻兄弟元素
                show_filter: false,
            },
            'aside': {
                name_en: 'aside',
                name_zh: '右侧信息栏',
                hide: true,
            },
        },
        'www.baidu.com': {
        },
    };
    return {
        // 获取所有标签
        getAllTags: () => {
            let result = [];
            const platform = Object.keys(CONFIG).find(k => host.includes(k));
            if (!platform) return result;

            for (const [tag, config] of Object.entries(CONFIG[platform])) {
                result.push({
                    tag: tag,
                    name_en: config?.name_en,
                    name_zh: config?.name_zh,
                    hide: config?.hide ?? false ,
                    hide_parent_siblings: config?.hide_parent_siblings?? false,
                    clear_child_styles: config?.clear_child_styles ?? false,
                    show_filter: config?.show_filter?? true,
                });
            }
            return result;
        },
        // 根据中文名称查询
        getTagByChineseName: (name_zh) => {
            let result = '';
            const platform = Object.keys(CONFIG).find(k => host.includes(k));
            if (!platform) return result;

            for (const [tag, config] of Object.entries(CONFIG[platform])) {
                const zhName = typeof config === 'object' ? config.name_zh : config;
                if (zhName === name_zh) {
                    return {
                        tag: tag,
                        name_en: config?.name_en,
                        name_zh: config?.name_zh,
                        hide: config?.hide ?? false ,
                        hide_parent_siblings: config?.hide_parent_siblings?? false,
                        clear_child_styles: config?.clear_child_styles ?? false,
                        show_filter: config?.show_filter?? true,
                    };
                }
            }
            return result;
        },
    }
})();

/* =============================== 页面元素 =============================== */
const webElement = (() => {
    const CONFIG = {
        'blog.csdn.net': {
            '.toolbar-container': {
                name_zh: '顶部工具栏',
                selector_type: 'class',
                name_en: 'toolbar-container',
                type: 'official',
                hide: true,
            },
            '#asideProfile': {
                name_zh: '个人信息',
                selector_type: 'id',
                name_en: 'asideProfile',
                type: 'official',
                hide: true,
            },
            "#asideHotArticle:has(h3[data-title='热门文章'])": {
                name_zh: '热门文章',
                selector_type: 'attribute',
                name_en: 'HotArticle',
                type: 'official',
                hide: true,
                clear_child_styles: true,
            },
            "#asideHotArticle:has(h3[data-title='大家在看'])": {
                name_zh: '大家在看',
                selector_type: 'attribute',
                name_en: 'WatchingArticle',
                type: 'official',
                hide: true,
                clear_child_styles: true,
            },
            '#asideNewComments': {
                name_zh: '最新评论',
                selector_type: 'id',
                name_en: 'asideNewComments',
                type: 'official',
                hide: true,
            },
            '#footerRightAds': {
                name_zh: '底部广告',
                selector_type: 'id',
                name_en: 'footerRightAds',
                type: 'official',
                hide: true,
            },
            '#recommendAdBox': {
                name_zh: '推荐广告',
                selector_type: 'id',
                name_en:'recommendAdBox',
                type: 'official',
                hide: true,
            },
            '#rightAside': {
                name_zh: '右侧信息栏',
                selector_type: 'id',
                name_en:'rightAside',
                type: 'official',
                hide: true,
            },
            '#groupfile': {
                name_zh: '默认目录',
                selector_type: 'id',
                name_en:'groupfile',
                type: 'official',
                hide: true,
            },
            '.aside-title': {
                name_zh: '目录标题',
                selector_type: 'class',
                name_en:'aside-title',
                type: 'official',
                hide: true,
                show_filter: false,
            },
            '.first-recommend-box': {
                name_zh: '第一推荐文章',
                selector_type: 'class',
                name_en:'first-recommend-box',
                type: 'official',
                hide: true,
            },
            '.second-recommend-box': {
                name_zh: '第二推荐文章',
                selector_type: 'class',
                name_en:'first-recommend-box',
                type: 'official',
                hide: true,
            },
            '.recommend-box': {
                name_zh: '其他推荐文章',
                selector_type: 'class',
                name_en:'recommend-box',
                type: 'official',
                hide: true,
            },
            '#csdn-copyright-footer': {
                name_zh: '版权信息',
                selector_type: 'id',
                name_en:'csdn-copyright-footer',
                type: 'official',
                hide: false,
            },
            "[id^='dmp_ad_']": {
                name_zh: '广告',
                selector_type: 'attribute',
                name_en:'dmp_ad_',
                type: 'official',
                hide: true,
            }
        },
        'zhuanlan.zhihu.com': {
            '.ColumnPageHeader-Wrapper': {
                name_zh: '顶部工具栏',
                selector_type: 'class',
                name_en:'ColumnPageHeader-Wrapper',
                type: 'official',
                hide: true,
            },
            '.Modal-wrapper.signFlowModal': {
                name_zh: '登录弹窗提示',
                selector_type: 'class',
                name_en: 'signFlowModal',
                type: 'official',
                hide: true,
                show_filter: false,
                dynamic: true
            },
            '.signFlowModal-container': {
                name_zh: '登录弹窗容器',
                selector_type: 'class',
                name_en:'signFlowModal-container',
                type: 'official',
                hide: true,
                show_filter: false,
                dynamic: true
            },
            '.Post-Row-Content-right': {
                name_zh: '右侧信息栏',
                selector_type: 'class',
                name_en: 'Post-Row-Content-right',
                type: 'official',
                hide: true,
            },
            '.Post-Sub.Post-NormalSub': {
                name_zh: '推荐阅读',
                selector_type: 'class',
                name_en: 'Post-Sub.Post-NormalSub',
                type: 'official',
                hide: true,
            },
            '.Post-Main': {
                name_zh: '文章主容器',
                selector_type: 'class',
                name_en: 'Post-Main',
                type: 'official',
                hide: false,
                show_filter: false,
                change: true,
                change_info: {
                    "display": "block",
                    "width": "800px",
                }
            },
        },
        'www.jianshu.com': {
        },
        'www.baidu.com': {
            '#u': {
                name_zh: '顶部工具栏',
                selector_type: 'id',
                name_en:'u',
                type: 'official',
                hide: true,
            },
            '#s_tab_inner': {
                name_zh: '搜索分类',
                selector_type: 'id',
                name_en:'s_tab_inner',
                type: 'official',
                hide: true,
            },
            "div[id^='content_left'] div:has(span:contains(广告))": {
                name_zh: '内容区广告',
                selector_type: 'attribute',
                name_en:'content_ads',
                type: 'official',
                hide: true,
                show_filter: false,
            },
            '#con-ar': {
                name_zh: '右侧信息栏',
                selector_type: 'id',
                name_en:'con-ar',
                type: 'official',
                hide: true,
            },
            '.se_common_hint': {
                name_zh: '加入保障',
                selector_type: 'class',
                name_en:'se_common_hint',
                type: 'official',
                hide: true,
            },
            '#con-right-bottom': {
                name_zh: '推广咨询',
                selector_type: 'id',
                name_en:'con-right-bottom',
                type: 'official',
                hide: true,
            },
            '#rs_new': {
                name_zh: '相关搜索',
                selector_type: 'id',
                name_en:'rs_new',
                type: 'official',
                hide: true,
            },
            '.new-pmd.c-container': {
                name_zh: '内容容器',
                selector_type: 'class',
                name_en:'new-pmd.c-container',
                type: 'official',
                hide: false,
                show_filter: false,
                change: true,
                change_info: {
                    "display": "block",
                    "width": "800px",
                }
            },
        },
    };
    return {
        // 返回所有选择器
        getAllSelectors: () => {
            const platform = Object.keys(CONFIG).find(k => host.includes(k));
            return platform ? Object.entries(CONFIG[platform]).map(([selector, config]) => ({
                name_zh: typeof config === 'object' ? config.name_zh : config,
                name_en: config?.name_en || selector,
                selector: selector,
                selector_type: config?.selector_type,
                hide: config?.hide ?? false,
                clear_child_styles: config?.clear_child_styles ?? false,
                show_filter: config?.show_filter ?? true,
                type: config?.type || 'official',
                dynamic: config?.dynamic ?? false,
                change: config?.change ?? false,
                change_info: config?.change_info || {},
            })) : [];
        },
        // 根据中文名称查询，如果中文名称为空则返回所有选择器
        getSelector: (name_zh) => {
            if (!name_zh) return this.getAllSelectors();

            const platform = Object.keys(CONFIG).find(k => host.includes(k));
            if (!platform) return [];

            for (const [selector, config] of Object.entries(CONFIG[platform])) {
                const zhName = typeof config === 'object' ? config.name_zh : config;
                if (zhName === name_zh) {
                    return [{
                        name_en: config?.name_en || selector,
                        selector: selector,
                        hide: config?.hide ?? false,
                        clear_child_styles: config?.clear_child_styles ?? false,
                        show_filter: config?.show_filter ?? true,
                        type: config?.type || 'official',
                        dynamic: config?.dynamic ?? false,
                        change: config?.change ?? false,
                        change_info: config?.change_info || {},
                    }];
                }
            }
            return [];
        },
    };
})();

/* =============================== 元素配置 =============================== */
const EelementConfig = (() => {
    const CONFIG = {
        'blog.csdn.net': {
            rightOffset: 850,
            topOffset: 110,
        },
        'zhuanlan.zhihu.com': {
            rightOffset: 800,
            topOffset: 100,
        },
        'www.jianshu.com': {
            rightOffset: 800,
            topOffset: 100,
        },
        'www.baidu.com': {
            rightOffset: 850,
            topOffset: 110,
        },
    };

    return {
        // 获取指定配置
        getConfig: () => {
            const [platformKey] = Object.keys(CONFIG)
                .filter(k => hostname.includes(k));
            return CONFIG[platformKey] || {};
        },
    };
})();

/* =============================== 动态样式 =============================== */
// 【目录】右侧偏移量
const tocRightOffset = () => {
    const { rightOffset } = EelementConfig.getConfig();
    return `max(20px, calc(50% - ${rightOffset}px))`;
};
// 【目录】顶部偏移量
const tocTopOffset = () => {
    const { topOffset } = EelementConfig.getConfig();
    return `${topOffset}px`;
};

/* =============================== 样式常量 =============================== */
// 目录样式
const LOC_CONFIG = {
    // 目录样式
    menu: {
        width: 'clamp(250px, 25vw, 300px)',     /* 响应式宽度 */
        right: tocRightOffset(),                /* 动态右侧间距 */
        top: tocTopOffset(),                    /* 动态顶部间距 */
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
        hoverTransform: 'translateX(5px)'       /* 平滑位移动画，向右移动5px */
    }
};

// =============================== 工具函数库 ===============================
const Utils = (() => {

  return {
        // 根据选择器获取元素
        getElemet: (element) => {
            return element.selector_type !== 'attribute' ? $(document.querySelector(element.selector)): $(element.selector);
        },

        // 生成标准化类选择器
        getTagSelector: (tag) => {
            const className = $(tag).attr('class');
            if (!className) {
                Logger.error(`元素标签 ${tag} 没有 class 属性`);
                return '';
            }
            return '.' + className.split(' ').join('.');
        },

        // 防抖函数，防止频繁触发事件
        debounce: (func, delay) => {
            let timer;
            return (...args) => {
                clearTimeout(timer);
                timer = setTimeout(() => func.apply(this, args), delay);
            };
        },

        setupCopyGuard: () => {
            // 禁用文本选择
            GM_addStyle(`
                * {
                    -webkit-user-select: none!important;
                    -moz-user-select: none!important;
                    -ms-user-select: none!important;
                    user-select: none!important;
                }
                .hljs {
                    user-select: text!important;
                }
            `);

            // 阻止右键菜单
            document.addEventListener('contextmenu', e => e.preventDefault());

            // 拦截剪贴板事件
            const handleClipboard = (e) => {
                const notice = '转载请注明出处：\n本文采用知识共享署名-非商业性使用 4.0 国际许可协议';
                e.clipboardData.setData('text/plain', notice);
                e.preventDefault();
                alert(notice);
            };
            document.addEventListener('copy', handleClipboard);
            document.addEventListener('cut', handleClipboard);
        },

        // 验证选择器类型是否有效
        validateSelectorType: (selector) => {
            const validTypes = ['id', 'class', 'attribute'];
            const selectorRegex = {
                'id': /^#([\w-]+|\[.+\])$/,
            };

            if (!validTypes.includes(selector.selector_type)) {
                return false;
            }
            if (selector.selector_type === 'id' && !selector.selector.match(selectorRegex[selector.selector_type])) {
                Logger.error(`无效 ${selector.selector_type} 选择器格式: ${selector.selector}`);
                return false;
            }
            return true;
        },
        // 动态元素监听器
        setupDynamicHandler: (selector, callback, delay = 300) => {
            const observer = new MutationObserver(Utils.debounce((mutations) => {
                mutations.forEach(mutation => {
                    if (mutation.addedNodes) {
                        $(mutation.addedNodes).find(selector).each((i, el) => callback(el));
                        if ($(selector, document.body).length) callback($(selector)[0]);
                    }
                });
            }, delay));

            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false,
                characterData: false
            });
        },
        // 隐藏元素
        hideElement: (selector, clearChildStyles) => {
            $(selector).hide();
            if (!clearChildStyles) return;
            $(selector).find("*").css({
                "display": "",
                "width": ""
            });
        },
        // 显示元素
        showElement: (selector, clearChildStyles) => {
            if (!clearChildStyles) return;
            // 显示父级后，清除子元素的内联样式，解决父级隐藏导致子级内联样式污染问题
            const $parent = $(selector).show();
            $parent.find("*").css({
                "display": "",
                "width": ""
            });
        },
        // 获取配置
        getAdConfig: () => {
            userSettings = JSON.parse(localStorage.getItem('adSettings') || '{}');
            return userSettings[hostname] || {};
        },
        dealElementVisible: (elementAlias, hidden, print) => {
            const userSettings = getAdConfig();
            const elementType = elementAlias.startsWith('element_')? 'element' : 'tag';
            const elementName = elementAlias.replace('element_', '').replace('tag_', '');

            let selector = '';
            if (elementType === 'element') {
                selector = elementName;
            } else if (elementType === 'tag') {
                selector = Utils.getTagSelector(elementName);
            }

            if (hidden) {
                Utils.hideElement(selector, true)
                Logger.simple(`${elementType} ${selector} 已隐藏`);
            } else {
                Utils.showElement(selector, true)
                Logger.simple(`${elementType} ${selector} 已启用`);
            }
            const formattedSettings = Object.entries(userSettings).map(([key, value]) => {
                if (key === elementAlias) {
                    return {'元素标识': `✅ ${key}`, '是否过滤': value}
                } else {
                    return {'元素标识': key, '是否过滤': value}
                }
            });
            if (print) {
                console.table(formattedSettings);
            }
            updateAdCounter.init();
        }
    }
})();

/* =============================== 核心功能模块 =============================== */

/* ======================== 目录生成模块 ======================== */
// 文章标题是否存在，默认为 true（存在）
let isTitleExist = true;

const TOCGenerator = (() => {
    // 获取排序后的唯一标题层级
    function getSortedUniqueLevels(titles) {
        const levelSet = new Set();

        titles.each(function() {
            const level = parseInt(this.tagName.substring(1));
            levelSet.add(level);
        });

        // 将 Set 转为数组并按 h1-h6 顺序排序
        return Array.from(levelSet).sort((a, b) => a - b);
    }

    // 页面元素
    const {
        tag: articleTag = 'article',
    } = elementTag.getTagByChineseName('文章');
    const {
        name_en: sideMenuLocName = 'side-menu-toc',
        selector: sideMenuLocSelector = '#side-menu-toc'
    } = customElement.getSelector("toc", "自定义目录") || {};
    const {
        name_en: menuLocOlName = 'menu_toc_ol',
        selector: menuLocOlSelector = '#menu_toc_ol'
    } = customElement.getSelector("toc","目录列表") || {};

    // 标题起始索引
    let titleIndex = 1;
    // 目录标题
    const LocTitle =  "📖 内容导航";
    // 获取所有标题，包含一级标题到六级标题
    const $titles = $(articleTag).find('h1, h2, h3, h4, h5, h6');
    if (!$titles.length) {
        isTitleExist = false;
        return false;
    }

    /* =============================== 事件监听 =============================== */
    // 加载/调整大小/滚动时触发（严格模式）
    const optimizedScrollHandler = Utils.debounce(() => bindScrollEvents(true), 100);
    window.addEventListener('load', optimizedScrollHandler);
    window.addEventListener('resize', optimizedScrollHandler);
    window.addEventListener('scroll', optimizedScrollHandler);

    // 滚动时触发，用于同步菜单滚动位置
    const optimizedSyncMenuScroll = Utils.debounce(() => syncMenuScroll(true), 100);
    window.addEventListener('scroll', optimizedSyncMenuScroll);

    /* =============================== 初始化目录结构 =============================== */
    const initStructure = () => {
        // 文章容器
        const $article = $(articleTag);
        if (!$article.length) {
            Logger.error(`[TOC] 未找到文章容器 ${articleTag}`);
            return false;
        }

        // 插入目录
        $article.prepend(`
            <div id=${sideMenuLocName} style="
                position: fixed;                                     /* 固定定位 */
                top: ${LOC_CONFIG.menu.top};                         /* 距离顶部的距离 */
                right: ${LOC_CONFIG.menu.right};                     /* 距离右侧的距离 */
                width: ${LOC_CONFIG.menu.width};                     /* 宽度 */
                background: ${LOC_CONFIG.menu.background};           /* 背景颜色 */
                z-index: ${LOC_CONFIG.menu.zIndex};                  /* 确保在其他元素之上 */
                border-radius: ${LOC_CONFIG.menu.borderRadius};      /* 圆角 */
                border-left: 1px solid #ccc;                         /* 左边框 */
                box-sizing: border-box;                              /* 包含边框和内边距 */
                box-shadow: ${LOC_CONFIG.menu.boxShadow};            /* 阴影 */
                padding:15px 20px;                                   /* 内边距 */
                line-height: 1.3;                                    /* 行高 */
                max-width: calc(100vw - 1000px);                     /* 防溢出保护 */
                max-height: 50vh;                                    /* 最大高度 */
                overflow-y: auto;                                    /* 溢出时显示滚动条 */
            ">
                <h2 style="margin:0 0 8px;font-size:18px;">
                    ${LocTitle}
                </h2>
                <hr style="
                    height: ${LOC_CONFIG.hr.height};                 /* 线条粗细 */
                    background: ${LOC_CONFIG.hr.color};              /* 背景颜色 */
                    margin: 12px 0;                                  /* 上下边距 */
                    border: none;                                    /* 移除默认边框 */
                ">
                <ol id=${menuLocOlName} style="list-style: none; margin: 0; padding: 0;"></ol>
            </div>
        `);
        return true;
    };

    /* =============================== 生成目录项 =============================== */
    const generateItems = () => {
        // 创建文档片段（内存中的临时容器）
        const fragment = document.createDocumentFragment();
        const duplicateTitlesLevel = getSortedUniqueLevels($titles);
        $titles.each(function() {
            // 标题级别
            const level = parseInt(this.tagName.substring(1));
            // 标题内容
            let title = $(this).text();
            // 标题ID
            const titleId = `toc_${titleIndex++}`;
            // 为标题添加ID
            $(this).attr('id', titleId);
            // 当前标题在去重后的层级中的索引
            const index = duplicateTitlesLevel.indexOf(level);

            let paddingLeft = 0;
            // 增加默认左边距，美化悬浮显示效果
            // 所有标题层级相同，或标题层级与去重按顺序排序后的第一个层级相同时满足条件
            if (duplicateTitlesLevel.length == 1 || index == 0) {
                paddingLeft = 10;
            } else {
                // 标题层级与去重按顺序排序后的最后一个层级相同时满足条件
                paddingLeft = index * 20;
            }

            // 生成目录项
            const $li = $(`
                <li class="${titleId}" style="
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
        $(menuLocOlSelector).append(fragment);
    };

    /* =============================== 绑定点击事件 =============================== */
    const bindClickEvents = () => {

        $(menuLocOlSelector).on('click', 'li', function() {
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
            $(`${menuLocOlSelector} li`).removeClass('active');
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

        const tocLinks = document.querySelectorAll(`${menuLocOlSelector} li`);
        // 更新激活状态
        tocLinks.forEach(link => {
            const classList = link.className || '';
            const firstClass = classList.split(/\s+/)[0] || '';
            link.classList.toggle('active', firstClass === currentId);
        });
    };

    // 页面和长目录滚动同步
    function syncMenuScroll() {
        const activeItem = $(`${menuLocOlSelector} li.active`)[0];
        if (!activeItem) return;

        const menu = $(sideMenuLocSelector)[0];
        const itemTop = activeItem.offsetTop;
        const itemHeight = activeItem.offsetHeight;
        const menuHeight = menu.clientHeight;

        // 计算目标滚动位置
        const targetScrollTop = itemTop - (menuHeight - itemHeight) / 2;

        // 节流平滑滚动
        if (!menu.scrollTimeout) {
            menu.scrollTimeout = setTimeout(() => {
                menu.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
                menu.scrollTimeout = null;
            }, 150); // 调整节流时间 (单位: 毫秒)
        }
    }

    /* =============================== 核心入口 =============================== */
    return {
        init: () => {
            if (!initStructure()) return;
            generateItems();
            bindClickEvents();
        },
    };
})();

/* =============================== 广告管理模块 =============================== */
const AdManager = (() => {
    // 存储模块
    const Storage = (() => {
        return {
            load: () => JSON.parse(localStorage.getItem('adSettings') || '{}'),
            save: (settings) => localStorage.setItem('adSettings', JSON.stringify(settings))
        };
    })();

    const {
        name_en: adControlName = 'ad-control',
    } = customElement.getSelector("ad", "广告控制栏") || {};

    // UI组件库
    const ControlPanel = (() => {
        const create = () => {
            const { menu } = LOC_CONFIG;
            return $(`
                <div id=${adControlName} style="
                    position: fixed;
                    bottom: 20px;
                    background: #fff !important;
                    right: ${menu.right};
                    width: ${menu.width};
                    background: ${menu.background};
                    box-shadow: ${menu.boxShadow};
                    border-radius: 8px;
                    padding: 15px;
                    min-height: 110px;
                    max-height: 40vh;
                    overflow-y: auto;
                    z-index: 99999;
                    display: block;
                ">
                    <span class="close-btn" style="
                        position: absolute;
                        right: 8px;
                        top: 1px;
                        cursor: pointer;
                        font-size: 15px;
                        color: #666;
                        &:hover { color: #333 }">
                        ×
                    </span>
                    <div style="
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            margin-bottom: 10px;
                        ">
                        <h3 style="margin: 0; font-size: 16px !important;">
                            🛡️ 广告过滤器&nbsp;
                            <span id="ad-counter" style="color: #666;">
                                (<span id="filtered-count">0</span>/<span id="total-count">0</span>)
                            </span>
                        </h3>
                        <button id="toggle-panel" style="
                                cursor: pointer;
                                background: none;
                                border: none;
                                font-size: 20px;
                            ">⬇️
                        </button>
                    </div>
                    <div id="filters" style="max-height: 25vh; overflow-y:auto;">
                    </div>
                    <div style="margin-top: 10px; display: flex; gap: 10px;">
                        <button id="reset-default" style="
                            flex: 1; padding: 5px; font-size: 14px !important; border: none !important;
                        ">
                            恢复默认
                        </button>
                        <button id="toggle-all" style="
                            flex: 1; padding: 5px; font-size: 14px !important; border: none !important;
                        ">
                            全部/取消
                        </button>
                    </div>
                </div>`);
        };
        return { create };
    })();

    // 核心逻辑
    const Core = (() => {
        const setupEventListeners = (panel) => {
        };

        return {
            init: () => {
                // 创建广告控制面板
                window.panel = ControlPanel.create();
                $('body').append(window.panel);
                setupEventListeners(window.panel);
            }
        };
    })();

    return {
        init: Core.init
    };
})();

// 广告计数器更新函数
const updateAdCounter = (() => {
    return {
      init: () => {
        const merged = webElement.getAllSelectors().concat(customElement.getAllSelectors());
        const counters = merged.filter(obj => {
            return Object.keys(obj).length > 0; // 仅保留非空对象
        });
        const total = counters.filter(c => {
            if (Utils.validateSelectorType(c)) {
                const el = Utils.getElemet(c);
                return el && c.show_filter;
            }
        }).length;
        const filtered = counters.filter(c => {
            if (Utils.validateSelectorType(c)) {
                const el = Utils.getElemet(c);
                return el && c.show_filter && el.is(":hidden");
            }
        }).length;

        $('#filtered-count').text(filtered);
        $('#total-count').text(total);
      }
    };
})();

const createControlPanel = () => {
    const panel = window.panel;
    // 从 localStorage 加载用户设置
    const adSettings = JSON.parse(localStorage.getItem('adSettings') || '{}');
    const userSettings = adSettings[hostname] || {};

    // =============================== 创建控制面板 ===============================
    const addFilter = (type, element) => {
        const selector = type=== "element" ? element.selector : element.tag;
        const name_zh = element.name_zh;
        const hide = element.hide;

        // 如果 localStorage 中没有设置，则使用默认值
        const userSetting = `${type}_${selector}`
        let isEnabled = userSettings[userSetting] !== undefined ? userSettings[userSetting] : hide;

        const el = Utils.getElemet(element);
        if (el.length > 0) {
            if (isEnabled && el  && el.is(":visible")) {
                isEnabled = false;
              } else if (!isEnabled && el && el.is(":hidden")) {
                isEnabled = true;
              }
        } else {
            isEnabled = false;
        }
        panel.find('#filters').append(`
            <label style="
                    display:flex; align-items:center; gap:8px; padding:5px; cursor:pointer;
                ">
                <input type="checkbox" ${isEnabled ? 'checked' : ''} data-selector="${userSetting}">
                <span style="font-size:13px;">${selector}『${name_zh}』</span>
            </label>
        `);
    }

    const elementList = [webElement.getAllSelectors() ?? [], customElement.getAllSelectors() ?? []]
    elementList.forEach((elements) => {
        elements.forEach((element) => {
            if (Utils.validateSelectorType(element) && element.show_filter) {
                const el = Utils.getElemet(element);
                if (!el) {
                    return;
                }
                addFilter("element", element);
            }
        });
    })

    const elementTags = elementTag.getAllTags() ?? [];
    elementTags.forEach((elTag) => {
        if (elTag.show_filter && $(elTag.tag)) {
            addFilter("tag", elTag);
        }
    })

    // =============================== 面板切换功能 ===============================
    panel.find('#toggle-panel').click(() => {
        panel.toggleClass('collapsed');
        $('#filters').slideToggle();
        $('#toggle-panel').text(panel.hasClass('collapsed') ? '⬆️' : '⬇️');
    });

    // =============================== 控制面板事件 ===============================
    // 保存设置到 localStorage
    panel.on('change', 'input[type="checkbox"]', function() {
        const elementAlias = $(this).data('selector');
        const isEnabled = $(this).prop('checked');

        // 更新用户设置
        userSettings[elementAlias] = isEnabled;
        adSettings[hostname] = JSON.stringify(userSettings);
        localStorage.setItem('adSettings', adSettings);

        // 应用设置
        Utils.dealElementVisible(elementAlias, isEnabled, true)

    });

    // 重置默认设置
    panel.find('#reset-default').click(() => {
        localStorage.removeItem('adSettings');
        // 刷新页面
        location.reload();
    });

    // 全选/全不选
    panel.find('#toggle-all').click(() => {
        const checkboxes = panel.find('input[type="checkbox"]');
        const allChecked = checkboxes.toArray().every(cb => cb.checked);
        checkboxes.prop('checked', !allChecked).trigger('change');
        updateAdCounter.init();
    });

    // 绑定广告关闭按钮点击事件
    $('#ad-control .close-btn').on('click', function() {
        $(this).closest('#ad-control').hide();
    });

    return panel;
};

const removeAds = () => {

    // =============================== 更新元素信息 ===============================
    Logger.primary("开始更新元素>>>")
    if (hostname == "blog.csdn.net") {
        // =============================== 【CSDN】 ===============================
        const TITLE_CONFIG = {
            allowedTitles: ['大家在看', '热门文章'],
            dataAttribute: 'data-title'
        };

        // 遍历所有目标 h3 元素
        const classSelector = '#asideHotArticle h3.aside-title';
        $(classSelector).each(function() {
            const $h3 = $(this);
            const titleText = $h3.text().trim(); // 获取清理后的文本内容

            if (TITLE_CONFIG.allowedTitles.includes(titleText)) {
                $h3.attr(TITLE_CONFIG.dataAttribute, titleText);
                Logger.ok(`[元素] [${classSelector}] ${TITLE_CONFIG.dataAttribute} 属性值设置为: ${titleText}`);
            }
        });
    }
    Logger.primary("更新元素完成<<<")

    // =============================== 批量隐藏（元素&标签） ===============================
    Logger.primary("开始隐藏元素>>>")
    const userSettings = Utils.getUserSettings();
    const isEmpty = Object.keys(userSettings).length === 0;
    if (!isEmpty) {
        Logger.primary("加载用户广告过滤规则");
        const userSettings = Object.entries(JSON.parse(localStorage.getItem('adSettings') || '{}'));
        userSettings.forEach(object => {
            Utils.dealElementVisible(object[0], object[1], false);
        })
        return;
    } else {
        Logger.primary("加载默认广告过滤规则");
        const elements = webElement.getAllSelectors() ?? [];
        elements.forEach(element => {
            const selector = element.selector;
            const clear_child_styles = element.clear_child_styles;
            Logger.ok(`[元素] [${selector}] 是否隐藏(${element.hide}) | 是否清除子级(${clear_child_styles})`)
            if (element.hide) {
                Utils.hideElement(selector, clear_child_styles);
            }
        });

        const elementTags = elementTag.getAllTags()?? [];
        elementTags.forEach(elTag => {
            const selector = Utils.getTagSelector(elTag.tag);
            const clear_child_styles = elTag.clear_child_styles;
            Logger.ok(`[元素] [${selector}] 是否隐藏(${elTag.hide}) | 是否清除子级样式(${clear_child_styles})`)
            if (elTag.hide) {
                Utils.hideElement(selector, clear_child_styles)
            }
            if (elTag.hide_parent_siblings) {
                // 隐藏元素的父级元素的所有同级节点
                $(selector).parent().siblings().hide();
            }
        });
    }
    Logger.primary("隐藏元素完成<<<")

    if (hostname === 'www.jianshu.com') {

    } else if (hostname === 'blog.csdn.net') {
        // =============================== 【CSDN】移除复制保护 ===============================
        $('.hljs-button.signin')
            .removeClass('signin') // 移除 signin 类
            .removeAttr('onclick') // 移除 onclick 属性
            .attr('data-title', '点击复制') // 设置新的 data-title 属性
            .on('click', async function() { // 新增点击事件，异步处理
                try {
                    const $button = $(this);
                    const $codeBlock = $button.closest('.hljs').find('code')
                                    || $button.siblings('.code-content');

                    // 同时写入纯文本和富文本格式
                    const htmlContent = $codeBlock.html()
                        .replace(/</g, '&lt;') // 保持 HTML 转义
                        .replace(/\n/g, '<br>') // 保留换行
                        + `<style>${$codeBlock.attr('style')}</style>`; // 保留代码样式

                    const textContent = $codeBlock.text()
                        .replace(/\n\s+/g, '\n') // 压缩缩进
                        .replace(/\t/g, '    '); // 替换制表符

                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/plain': new Blob([textContent], { type: 'text/plain' }),
                            'text/html': new Blob([
                                `<pre style="${$codeBlock.attr('style')}" class="${$codeBlock.attr('class')}">${htmlContent}</pre>`
                            ], { type: 'text/html' })
                        })
                    ]);
                    $button.attr('data-title', '✅ 已复制');
                    setTimeout(() => $button.attr('data-title', '点击复制'), 2000);
                } catch (err) {
                    Logger.error('复制失败:', err);
                    $button.attr('data-title', '❌ 复制失败');
                    setTimeout(() => $button.attr('data-title', '点击复制'), 1500);
                }
            });;
        Utils.setupDynamicHandler('#passportbox', () => {
            $('#passportbox > img').click();
        });

    } else if (hostname === 'zhuanlan.zhihu.com') {
        // =============================== 【知乎】监控登录弹窗 ===============================
        Utils.setupDynamicHandler('.signFlowModal-container', () => {
            $('.Modal-closeButton').click();
            $('body.PostIndex-body div:has(button[class*="Button--primary"]:contains(立即登录/注册))').hide();
        });

        Utils.setupDynamicHandler('.body.PostIndex-body', () => {
            $('body.PostIndex-body div:has(button[class*="Button--primary"]:contains(立即登录/注册))').hide();
        });

        // =============================== 【知乎】监控点击链接 ===============================
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link?.href?.includes('link.zhihu.com')) {
              const decodedUrl = decodeURIComponent(link.href.split('target=')[1]);
              link.href = decodedUrl;
            }
          });

    } else if (hostname === 'www.baidu.com') {

    };
};

const makeBeatiful = () => {
    const elements = webElement.getAllSelectors() ?? [];``
    elements.forEach(element => {
        if (element.change) {
            Object.entries(element.change_info).forEach(change => {
                $(element.selector).css(change[0], `${change[1]}!important`);
            })
        }
    });
    if (hostname === 'blog.csdn.net') {

    } else if (hostname === 'zhuanlan.zhihu.com') {

    } else if (hostname === 'www.jianshu.com') {

    } else if (hostname === 'www.baidu.com') {
    }
}

/* =============================== 样式管理模块 =============================== */
GM_addStyle(`
    /* =============================== 广告控制面板 =============================== */
    #ad-control.collapsed {
        height: 40px;
        overflow: hidden;
    }
    #ad-control button {
        background: #f0f0f0;
        border-radius: 4px;
        transition: all 0.2s;
    }
    #ad-control button:hover {
        background: #e0e0e0;
    }
    #filters label:hover {
        background: #f5f5f5;
    }
    @media (prefers-color-scheme: dark) {
        #ad-control {
            background: #2d2d2d !important;
            color: #e0e0e0;
        }
        #ad-control button {
            background: #404040;
            color: #fff;
        }
        #filters label:hover {
            background: #3d3d3d;
        }
    }

    /* =============================== 目录 =============================== */
    #menu_toc_ol li {
        font-size: ${LOC_CONFIG.listItem.fontSize};             /* 字体大小 */
        cursor: pointer;                                        /* 鼠标悬停时的光标样式 */
        transition: all 0.2s;                                   /* 过渡效果 */
        border-radius: 4px;                                     /* 圆角 */
        padding-top: 4px;                                       /* 上边距 */
        padding-bottom: 4px;                                    /* 下边距 */
    }
    #menu_toc_ol li:hover {
        background: #e7b948;                                  /* 悬停时的背景颜色 */
        text-decoration: underline;                             /* 悬停时添加下划线 */
        transform: ${LOC_CONFIG.listItem.hoverTransform};       /* 悬停时的动画效果 */
    }
    #menu_toc_ol li.active {
        color: #1902c0;                                       /* 点击时的文字颜色 */
        font-weight: 500;                                       /* 加粗显示 */
        background: #e8f0fe;                                  /* 点击时的背景颜色 */
    }
    @media (prefers-color-scheme: dark) {                       /* 深色模式 */
        #side-menu-toc {
            background: #2d2d2d !important;
            color: #e0e0e0;
        }
        #side-menu-toc h2 {
            color: #e0e0e0 !important;
        }
        #menu_toc_ol li.active {
            background: #88969f;
        }
        #menu_toc_ol li:hover {
            background: #a4c99e;
            color: #000000;
        }
    }
    /* 响应式处理 */
    @media (max-width: 1400px) {
        #side-menu-toc, #ad-control {
            display: none !important;
        }
    }
`);

/* =============================== 主执行流程 =============================== */
(() => {
    'use strict';

    /* =============================== 移除广告 =============================== */
    (() => {
        // try {
            Logger.simple("=".repeat(150));
            removeAds();
            Logger.info('[ADB] ✅ 广告已净化');
        // } catch (e) {
        //     Logger.error('[ADB] 💥 广告净化模块异常 - ', e);
        // }
    })();

    /* =============================== 广告控制 =============================== */
    (() => {
        // try {
        Logger.simple("=".repeat(150));
        AdManager.init();
        $('body').append(createControlPanel());
        updateAdCounter.init();
        Logger.info('[ADC] ✅ 控制面板已生成');
        // } catch (e) {
        //     Logger.error('[ADC] 💥 广告控制模块异常 - ', e);
        // }
    })();

    /* =============================== 样式美化 =============================== */
    (() => {
        try {
            Logger.simple("=".repeat(150));
            makeBeatiful();
            Logger.info('[MBF] ✅ 页面已美化');
        } catch (e) {
            Logger.error('[MBF] 💥 页面美化模块异常 - ', e);
        }
    })();

    /* =============================== 生成目录 =============================== */
    const shouldGenerateTOC = (() => {
        try {
            if (!isTitleExist) {
                Logger.info('[TOC] 文章标题不存在，跳过目录生成');
                return false;
            }
            return true;
        } catch (e) {
            Logger.error('[TOC] 💥 目录预检异常 - ', e);
            return false;
        }
    })();

    (() => {
        try {
            Logger.simple("=".repeat(150));
            if (!shouldGenerateTOC) return;
            TOCGenerator.init();
            Logger.info('[TOC] ✅ 文章目录已生成，请尽情享受吧！🎉 🍺');
            Logger.simple("=".repeat(150));
        } catch (e) {
            Logger.error('[TOC] 💥 目录生成模块异常 - ', e);
        }
    })();
})();