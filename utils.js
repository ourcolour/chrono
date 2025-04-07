/**
 *  获取完整URL
 * @param url
 * @returns {`${string}/${string|*}`}
 */
export const getFullUrl = (url) => {
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