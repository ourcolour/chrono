// --------------------
// Popup.js
// --------------------

// --------------------
// Functions
// --------------------
const DEFAULT_VERSION = '0.0.1'
const FORMAT_LIST = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', /* 'svg', */];
const CONFIG = {
    // 实时数据获取
    realtimeFetching: true, // 过滤条件
    filter          : {
        sizeType: null,
        format  : null,
        layout  : null,
        url     : null,
    }, //
}

/**
 * 从HTML中提取图片
 * @param html
 * @returns {Promise<void>}
 */
const extractData = async (html) => {
    // 从html中提取链接
    const regex = /['"](?<url>(?:https?:\/)\/?[^'"]+)['"]/gi;
    const matchList = html.matchAll(regex);

    // 结果
    const result = [];

    // 逐个处理
    let index = 0;
    for (const match of matchList) {
        // 提取的url地址
        const url = match.groups?.url;
        if (null === url || 1 > url.length) {
            continue;
        }

        // 补全 url 链接
        const fullUrl = getFullUrl(url);
        if (null === fullUrl || 1 > fullUrl.length) {
            continue;
        }

        // 提取拓展名
        const fileNameAndExtension = getFileNameAndExtension(url);

        // 比较是否有效的扩展名
        if (!isValidFileExtension(fileNameAndExtension.fileName)) {
            continue;
        }

        // 构建图片对象
        const imageObj = {
            index   : index,
            url     : url,
            fullUrl : fullUrl,
            fileName: fileNameAndExtension.fileName,
            fileExt : fileNameAndExtension.fileExt,
            format  : fileNameAndExtension.fileExt?.toUpperCase(), // fileSize        : fileSize,
            // formatedFileSize: formatBytes(fileSize, 2),
            // width           : imgSize.width,
            // height          : imgSize.height,
        };

        // 添加到结果中
        result.push(imageObj);

        console.log(`收录图片：${JSON.stringify(imageObj)}`);

        index++;
    }

    return result;
}

const formatBytes = (bytes, decimals) => {
    if (0 === bytes) return '0 B';
    const k = 1024;
    const dm = decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 *  获取完整URL
 * @param url
 * @returns {`${string}/${string|*}`}
 */
const getFullUrl = (url) => {
    // 获取当前主机头
    const host = window.location.origin;
    const protocol = window.location.protocol;

    // 如果 ‘//’ 开头，补全 url 地址
    if (url.startsWith('//')) {
        url = `${protocol}${url}`;
    }
    // 如果 ‘/’ 开头，补全 url 地址
    else if (!url.startsWith('http')) {
        url = `${host}${url}`;
    }

    return url;
}

/**
 * 获取有效扩展名
 * @param url
 * @returns {null|string}
 * @private
 */
const getFileNameAndExtension = (url) => {
    // 从url中提取文件名
    const fileName = url.split('/').pop();
    // 提取扩展名
    let fileExt = fileName.split('.').pop().toLowerCase();
    // 单独处理 jpeg 后缀名
    if ('jpeg' === fileExt) {
        fileExt = 'jpg';
    }

    return {
        fileName: fileName,
        fileExt : fileExt,
    };
}

/**
 * 判断是否有效的扩展名
 * @param fileName
 * @returns {boolean}
 */
const isValidFileExtension = (fileName) => {
    // Args
    if (null === fileName || 1 > fileName.length) {
        return false;
    }

    // 提取扩展名
    const fileExt = fileName.split('.').pop().toLowerCase();
    // 比较是否有效的扩展名
    return FORMAT_LIST.includes(fileExt);
}

/**
 * 过滤数据
 * @param filter
 * @desc 图片对象
 *       const imageObj = {
 *           url     : url,
 *           fullUrl : fullUrl,
 *           fileName: fileNameAndExtension.fileName,
 *           fileExt : fileNameAndExtension.fileExt,
 *       };
 */
const filterData = (filter) => {
    // Args
    if (!filter) {
        filter = newFilter();
    }

    // Nodes
    const $resultImage = document.querySelector('.resultImage');
    const $excludeCellList = $resultImage.querySelectorAll('.exclude');

    // 清除所有排除项目 .exclude
    $excludeCellList.forEach($cell => {
        $cell.classList.remove('exclude');
    });

    // 排除项目函数
    const _excludeCell = (selector) => {
        const $invalidCellList = $resultImage.querySelectorAll(selector);
        $invalidCellList.forEach($cell => {
            $cell.classList.add('exclude');
        });
    };

    // size
    if (filter.size && 0 < filter.size.length) {
        _excludeCell(`.cell:not([data-sizeType="${filter.size}"])`);
    }
    // format
    if (filter.format && 0 < filter.format.length) {
        _excludeCell(`.cell:not([data-format="${filter.format}"])`);
    }
    // layout
    if (filter.layout && 0 < filter.layout.length) {
        _excludeCell(`.cell:not([data-layout="${filter.layout}"])`);
    }
    // url
    if (filter.url && 0 < filter.url.length) {
        _excludeCell(`.cell:not([data-fullUrl*="${filter.url}"])`);
    }

    // 更新选中数量
    updateSelectedCount();

    // 排序
    sortCellByAttribute();
}

/**
 * 是否监控页面
 */
const getIsMonitoringPage = () => {
    // Nodes
    const $monitorPage = document.querySelector('.monitor-page label input[type="checkbox"]');
    return $monitorPage.checked;
}

/**
 * 切换加载状态
 */
const toggleLoadingDisplayStatus = (toShow) => {
    // Nodes
    const $loading = document.querySelector('.loading');

    // Args
    if ('undefined' === typeof toShow) {
        toShow = 'none' === $loading.style.display;
    }

    // 切换显示状态
    $loading.style.display = toShow ? 'flex' : 'none';

    return toShow;
}

/**
 * 更新总数
 * @param value
 */
const updateTotalCount = (value) => {
    // Args
    if ('undefined' === typeof value) {
        // 从DOM中获取
        value = document.querySelectorAll('.resultImage .cell').length;
    }

    // Nodes
    const $totalCountList = document.querySelectorAll('.total-count');

    // 更新计数
    $totalCountList.forEach(($totalCount) => {
        $totalCount.innerHTML = value;
    });
}

/**
 * 更新已选中数量
 * @returns {Element}
 */
const updateSelectedCount = (value) => {
    // Nodes
    const $resultImage = document.querySelector('.resultImage');
    const $selectedCount = document.querySelector('.selected-count');
    const $downButton = document.querySelector('.down-button');

    // 选中数量
    if (!value) {
        value = $resultImage.querySelectorAll('.selected').length
    }

    // 更新选中数量
    $selectedCount.innerHTML = `${value}`;

    // 更新下载按钮状态
    if (0 < value) {
        $downButton.style.display = 'inline-block';
    } else {
        $downButton.style.display = 'none';
    }

    return value;
}

/**
 * 通过HTML获取图片
 */
const fetchData = () => {
    // Call
    chrome.tabs.query({
        active       : true,
        currentWindow: true
    }, (tabs) => {
        chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func  : () => document.documentElement.outerHTML,
        }, async (data) => {
            // 忽略空数据
            if (!data || 1 > data.length || !data[0].result) {
                return;
            }

            /* 处理数据 */
            // 原始html
            const html = data[0].result;

            // 显示加载状态
            toggleLoadingDisplayStatus(true);

            // 从HTML中提取图片
            const imageInfoList = await extractData(html);

            // 添加图片到dom
            addImageList(imageInfoList);
        });
    });
}

const newImage = async (fullUrl) => {
    return new Promise(async (resolve, reject) => {
        try {
            // 通过fetch获取图片
            const response = await fetch(fullUrl);
            // 判断是否正确加载
            if (!response.ok) {
                return reject(response);
            }

            // 读取文件大小
            const contentLength = response.headers.get('content-length');

            // 读取二进制数据
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            // 创建并加载图片
            const img = new Image();
            img.alt = fullUrl;
            img.src = blobUrl;
            img.onload = (evt) => {
                // 释放内存
                URL.revokeObjectURL(blobUrl);

                // 更新返回值
                resolve({
                    $img         : img,
                    contentLength: contentLength,
                });
            }
            img.onerror = (evt) => {
                reject(evt);
            };
        } catch (e) {
            console.info(`Load img failed: ${e}`);
        }
    });
}

const newCell = async (imageObj, debug) => {
    // Args
    if (debug) {
        console.time(`newCell(${imageObj.fileName})`);
    }

    try {
        // 生成图片
        const res = await newImage(imageObj.fullUrl);
        const $img = res.$img;
        const fileSize = res.contentLength;

        /* 更新图片信息 */
        // 图片尺寸
        imageObj.width = $img.naturalWidth;
        imageObj.height = $img.naturalHeight;
        imageObj.pixelCount = $img.naturalWidth * $img.naturalHeight;
        imageObj.sizeType = 'small';
        if (200 * 200 > imageObj.pixelCount) {
            imageObj.sizeType = 'small';
        }
        if (200 * 200 <= imageObj.pixelCount) {
            imageObj.sizeType = 'medium';
        }
        if (800 * 600 <= imageObj.pixelCount) {
            imageObj.sizeType = 'large';
        }
        // 图片比例
        if (imageObj.width >= (imageObj.height * 1.2)) {
            imageObj.layout = 'wide';
        } else if (imageObj.height >= (imageObj.width * 1.2)) {
            imageObj.layout = 'tall';
        } else {
            imageObj.layout = 'square';
        }
        // 文件大小
        imageObj.fileSize = fileSize;
        imageObj.formatedFileSize = formatBytes(fileSize, 0);

        // 内容模板
        const html = `<div class="cell"
            data-index="${imageObj.index}" 
            data-url="${imageObj.url}" 
            data-fullUrl="${imageObj.fullUrl}"
            data-fileName="${imageObj.fileName}"
            data-fileExt="${imageObj.fileExt}"
            data-format="${imageObj.fileExt}"
            data-width="${imageObj.width}"
            data-height="${imageObj.height}"
            data-pixelCount="${imageObj.pixelCount}"
            data-sizeType="${imageObj.sizeType}"
            data-layout="${imageObj.layout}"
            data-fileSize="${imageObj.fileSize}"
            data-formatFileSize="${imageObj.formatedFileSize}"> 
        <div class="border"></div>
        <div class="cell-header">
            <div class="button-list">
                <a class="checkbox-button-link select" href="#">
                    <iconpark-icon name="square" size="16" color="#ebebeb"></iconpark-icon>
                </a>
                <a class="checkbox-button-link share" href="${imageObj.fullUrl}" target="_blank">
                    <iconpark-icon name="share" size="16" color="#ebebeb"></iconpark-icon>
                </a>
                <a class="checkbox-button-link download" href="#">
                    <iconpark-icon name="download-one" size="16" color="#ebebeb"></iconpark-icon>
                </a>
                <a class="checkbox-button-link zoom" href="https://www.baidu.com/s?wd=${imageObj.fileName}" target="_blank">
                    <iconpark-icon name="zoom-in" size="16" color="#ebebeb"></iconpark-icon>
                </a>
            </div>
            <div class="info-list">
                <span class="item img-format">${imageObj.fileExt.toUpperCase()}</span>
                <span class="item img-size">${imageObj.width}x${imageObj.height}</span>
                <span class="item img-file-size">${imageObj.formatedFileSize}</span>
                <!--<span class="item img-index">${imageObj.index}</span>-->
<!--                <span class="item img-index">${imageObj.layout}</span>-->
<!--                <span class="item img-index">${imageObj.sizeType}</span>-->
            </div>
        </div>
        <div class="img-container">
<!--            <img class="img">-->
        </div>
        <div class="cell-footer">
            <span class="text">${imageObj.fileName}</span>
        </div>
    </div>
    `;

        // 创建临时元素
        const $tempDiv = document.createElement('div');
        $tempDiv.innerHTML = html;

        // 添加图片到 .img-container
        const $imgContainer = $tempDiv.querySelector('.img-container');
        $imgContainer.appendChild($img);

        if (debug) {
            console.timeEnd(`newCell(${imageObj.fileName})`);
        }

        return $tempDiv.firstChild;
    } catch (e) {
        const res = await e;
        console.info(res);
    }
}

/**
 * 清空原有内容
 */
const clearImageList = () => {
    // Nodes
    const $resultImage = document.querySelector('.resultImage');
    // 清空内容
    $resultImage.innerHTML = '';
    // 更新总数
    updateTotalCount(0);
}

/**
 * 添加图片列表
 * @param imageInfoList
 * @returns {*[]}
 *
 * @desc 图片对象列表
 *     const imageInfo = {
 *         url     : url,
 *         fullUrl : fullUrl,
 *         fileName: fileNameAndExtension.fileName,
 *         fileExt : fileNameAndExtension.fileExt,
 *         format  : fileNameAndExtension.fileExt?.toUpperCase(),
 *         // fileSize        : fileSize,
 *         // formatedFileSize: formatBytes(fileSize, 2),
 *         // width           : imgSize.width,
 *         // height          : imgSize.height,
 *     };
 */
const addImageList = async (imageInfoList) => {
    const result = [];

    // Args
    if (!imageInfoList || 1 > imageInfoList.length) {
        return result;
    }

    // Nodes
    const $resultImage = document.querySelector('.resultImage');

    // 清空原有内容
    clearImageList();
    // 更新选中数量
    updateSelectedCount(0);

    // 遍历每一个图片信息
    console.time('解析预览图');
    let count = 0;
    Promise.all(imageInfoList.map(async (info, index) => {
        // 构建 cell
        const $cell = await newCell(info);
        if ($cell) {
            // 添加到dom
            $resultImage.appendChild($cell);
            // 总数加一
            count++;
            // 更新总数
            updateTotalCount(count);
        }
    })).then(() => {
        // 过滤数据
        filterData();
    }).finally(() => {
        // 隐藏加载状态
        toggleLoadingDisplayStatus(false);
    });
    console.timeEnd('解析预览图');

    return result;
}

/**
 * 构建过滤器
 * @returns {{layout: *, size: *, format: *, url: *}}
 */
const newFilter = (size, format, layout, url) => {
    // Nodes
    const sizeFilter = size ? size : document.querySelector('[name="filter[size]"]').value;
    const formatFilter = format ? format : document.querySelector('[name="filter[format]"]').value;
    const layoutFilter = layout ? layout : document.querySelector('[name="filter[layout]"]').value;
    const urlFilter = url ? url : document.querySelector('[name="filter[url]"]').value;

    // Query
    return {
        size  : sizeFilter,
        format: formatFilter,
        layout: layoutFilter,
        url   : urlFilter,
    };
}

/**
 * 排序cell
 * @param attrName
 * @param isAsc
 */
const sortCellByAttribute = (attrName, isAsc) => {
    // Args
    if (!attrName) {
        attrName = 'index';
    }
    // 数字格式的属性
    const numberAttributeList = ['index', 'pixelCount', 'fileSize',];
    // 是否数字属性
    let isNum = 0 < numberAttributeList.find((attr) => {
        return attrName === attr
    }).length;
    // 升序/降序
    if (!isAsc) {
        isAsc = true;
    }

    // Nodes
    const $resultImage = document.querySelector('.resultImage');
    const $cellList = $resultImage.querySelectorAll(`.cell`);
    if (!$cellList || 1 > $cellList.length) {
        return;
    }

    // 转换为数组并排序
    const sortedCellList = Array.from($cellList)
        .sort((c1, c2) => {
            const attr1 = c1.dataset[attrName];
            const attr2 = c2.dataset[attrName];

            // 数字格式
            if (isNum) {
                // 升序
                if (isAsc) {
                    return parseInt(attr1) - parseInt(attr2);
                }
                // 降序
                return parseInt(attr2) - parseInt(attr1);
            }
            // 其他格式
            else {
                // 升序
                if (isAsc) {
                    return attr1.localeCompare(attr2);
                }
                // 降序
                return attr2.localeCompare(attr1);
            }
        });

    // 讲元素移动到末尾，保持顺序
    sortedCellList.forEach($cell => {
        $resultImage.appendChild($cell);
    });
}

/**
 * 清除所有cell选中状态
 */
const clearCellSelectedStatus = () => {
    // Nodes
    const $resultImage = document.querySelector('.resultImage');
    const $cellList = $resultImage.querySelectorAll('.cell.selected');

    // 遍历所有并重置选中状态
    for (const $cell of $cellList) {
        toggleCellSelectedStatus($cell, false);
    }
}

/**
 * 更改cell选中状态
 */
const toggleCellSelectedStatus = ($cell, toSelect) => {
    if (!$cell) {
        return;
    }

    // Nodes
    const $icon = $cell.querySelector('.cell .checkbox-button-link.select iconpark-icon');

    // 切换选中状态（目标状态）
    if ('undefined' === typeof toSelect) {
        toSelect = !$cell.classList.contains('selected');
    }

    // 目标:选中
    if (toSelect) {
        $cell.classList.add('selected');
        $icon.name = 'check-correct';
    }
    // 目标:取消选中
    else {
        $cell.classList.remove('selected');
        $icon.name = 'square';
    }

    // 更新选中数量
    updateSelectedCount();
}

/**
 * 注册预览图复选按钮事件
 */
const previewAddEventListener = () => {
    // Nodes
    const $resultImage = document.querySelector('.resultImage');

    /* 注册通用事件，委托父元素监听子元素事件 */
    $resultImage.addEventListener('click', async (evt) => {
        // download
        if (evt.target.classList.contains('download')) {
            // 不再冒泡
            evt.stopPropagation();
            // Nodes
            const $cell = evt.target.closest('.cell');
            if ($cell) {
                const fullUrl = $cell.getAttribute('data-fullUrl');
                const fileName = $cell.getAttribute('data-fileName');
                // 触发下载事件
                await download(fullUrl, fileName);
            }
        }
            // else if (evt.target.classList.contains('zoom')) {
            //     // Nodes
            //     const $cell = evt.target.closest('.cell');
            //     if ($cell) {
            //         const fileName = $cell.getAttribute('data-fileName');
            //         const url = `https://www.baidu.com/s?wd=${fileName}`;
            //
            //     }
            // }
        // .select / .cell-header / .cell
        else if (evt.target.classList.contains('select') || evt.target.classList.contains('cell-header') || evt.target.classList.contains('cell')) {
            // 不再冒泡
            evt.stopPropagation();
            // Nodes
            const $cell = evt.target.closest('.cell');
            // 更改选中状态
            toggleCellSelectedStatus($cell);
        }
    });
}

/**
 * 后台下载图片
 */
const download = async (url, saveAsName) => {
    // 消息对象
    const msg = {
        type: 'download',
        data: {
            url       : url,
            saveAsName: saveAsName,
        },
    };

    // 发送给后台进程
    const response = await chrome.runtime.sendMessage(msg);
    console.log(`download: ${response}`);
}

// --------------------
// Init
// --------------------
(() => {
    /**
     * 注册页面更新监听器
     */
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        console.log(`收到消息: ${message.type} Sender: ${sender} Response: ${sendResponse}`);

        // 是否监听页面
        const isMonitoringPage = getIsMonitoringPage();
        if (!isMonitoringPage) {
            return;
        }

        // 更新数据
        if ('tabActivated' === message.type) {
            // 清空图片列表
            clearImageList();
            // 重新获取数据
            fetchData();
        } else if ('pageLoading' === message.type) {
            // 清空图片列表
            clearImageList();
            // 重新获取数据
            fetchData();
        } else if ('pageUpdated' === message.type) {
        } else {
            console.log(`检测到未监听动作：${message.type}`);
        }
    });
    /**
     * 注册refresh-button
     */
    document.querySelector('.refresh-button')?.addEventListener('click', evt => {
        // 请求数据
        fetchData();
    });
    /**
     * 注册FetchImage
     */
    document.querySelectorAll('.fetch-button').forEach($btn => {
        $btn.addEventListener('click', () => {
            fetchData();
        });
    })
    /**
     * 注册Download
     */
    document.querySelectorAll('.down-button').forEach($btn => {
        $btn.addEventListener('click', async () => {
            // Node
            const $selectedCellList = document.querySelectorAll('.resultImage .cell.selected');

            // 提取 src
            const urlList = Array.from($selectedCellList).map($cell => $cell.getAttribute('data-fullUrl'));
            if (1 > urlList.length) {
                return;
            }

            // 等待下载 url 列表
            for (let i = 0; i < urlList.length; i++) {
                // if (i >= 2) {
                //     break;
                // }
                const url = urlList[i];
                // 下载
                await download(url);
            }
        });
    });

    /**
     * 注册滚动到顶部
     */
    document.querySelectorAll('.top-button').forEach($btn => {
        $btn.addEventListener('click', (evt) => {
            document.querySelector('section.result')?.scrollTo({
                top     : 0,
                behavior: 'smooth',
            });
        })
    });

    /**
     * 注册过滤器事件
     */
    document.querySelectorAll('.filter-list .filter [name*="filter"]').forEach($item => {
        // 标签名称
        const tagName = $item.tagName.toLowerCase();

        // select
        if ('select' === tagName) {
            $item.addEventListener('change', (evt) => {
                // 清除所有cell选中状态
                clearCellSelectedStatus();
                // 过滤数据
                filterData();

                console.log(`Filter: ${evt.currentTarget.name}=${evt.currentTarget.value}`)
            });
        }
        // input
        else if ('input' === tagName) {
            $item.addEventListener('keypress', (evt) => {
                // 监听回车
                if (13 === evt.keyCode) {
                    // 清除所有cell选中状态
                    clearCellSelectedStatus();
                    // 过滤数据
                    filterData();
                    // 阻止默认事件
                    evt.preventDefault();
                }
            });
        }
    });

    // 获取数据
    fetchData();

    // 注册预览图复选按钮事件
    previewAddEventListener();
})();
