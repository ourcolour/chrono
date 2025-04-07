// --------------------
// Service Worker
// --------------------

// --------------------
// Functions
// --------------------
const ALBUM_REGEX = /^(?<name>[a-zA-Z]+)(?<no>\d+)p[ls]\.jpg$/gi;

/**
 * 下载文件
 * @param url
 * @param saveAsName
 */
const download = async (url, saveAsName) => {
    // 指定输出文件名
    let fileName = saveAsName;
    // 尝试从 url 中获取
    if (null === fileName || 1 > fileName.length) {
        fileName = url.split('/').pop();
    }
    // 处理车牌
    if (ALBUM_REGEX.test(fileName)) {
        const matched1 = fileName.match(ALBUM_REGEX);
        const matched = ALBUM_REGEX.exec(fileName);
        if (matched) {
            const series = matched.groups.name.toUpperCase()
            let no = matched.groups.no.substring(3);
            // 对no左侧补齐3个0
            while (no.length < 3) {
                no = `0${no}`;
            }
            fileName = `${series}-${no}`;
        }
    }

    // 下载
    return await chrome.downloads.download({
        url           : url,
        saveAs        : false,
        conflictAction: 'uniquify',
        filename      : fileName,
    }, (downloadId) => {
        console.log(`成功下载: ${downloadId}`)
    });
};

// --------------------
// Inits
// --------------------
(() => {
    console.log('Background service worker started');

    /**
     * 插件成功加载
     */
    chrome.runtime.onInstalled.addListener(() => {
        console.log('Extension installed');
    });

    /**
     * 接受消息
     */
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
        console.log(`收到消息: ${message} Sender: ${sender} Response: ${sendResponse}`);

        /* 解析命令 */
        // 下载图片
        if ('download' === message.type) {
            const data = message.data;
            const url = data.url;
            let saveAsName = data.saveAsName;
            // 如果没有指定 saveAsName，则使用 url 的文件名
            if (!saveAsName) {
                saveAsName = url.split('/').pop();
            }
            // 下载文件
            await download(url, saveAsName);
        }
    });

    /**
     * 注册打开侧边栏
     */
    chrome.sidePanel.setPanelBehavior({openPanelOnActionClick: true});
})();
