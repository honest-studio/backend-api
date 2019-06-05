// Stolen from https://raw.githubusercontent.com/yfermin/favicon-fetcher/master/src/favicon-fetcher.js
const axios = require('axios');
const parse5 = require('parse5');
const url = require('url');

export interface FaviconReturnPack {
    url: string;
    area: number;
}

export function fetchUrl(siteUrl) {
    return new Promise((resolve, reject) => {
        axios.get(siteUrl)
        .then(response => {
            const html = response.data;
            const faviconUrl = crawlHTMLForFaviconUrl(html);
            resolve(resolveFaviconUrl(siteUrl, faviconUrl));
        })
        .catch(reject);
    });
}

function resolveFaviconUrl(siteUrl, faviconUrl) {
    const parsedSiteUrl = url.parse(siteUrl);
    console.log(siteUrl)
    if (faviconUrl !== null) {
        const parsedFaviconUrl = url.parse(faviconUrl);
        console.log(parsedFaviconUrl)
        if (parsedFaviconUrl.protocol && parsedFaviconUrl.host) {
            return faviconUrl;
        }
        else if (parsedFaviconUrl.path.startsWith("//")){
            // Guess the protocol from the host
            return `${parsedSiteUrl.protocol}${parsedFaviconUrl.path}`;
        }
        else if (parsedFaviconUrl.path.startsWith("/")){
            // Guess the protocol from the host
            // Add an extra slash
            return `${parsedSiteUrl.protocol}/${parsedFaviconUrl.path}`;
        }
    }
    return `${parsedSiteUrl.protocol}//${parsedSiteUrl.host}/favicon.ico`;
}

function crawlHTMLForFaviconUrl(html): string {
    const document = parse5.parse(html);
    const htmlNode = document.childNodes.find(node => node.tagName === "html");
    const headNode = htmlNode.childNodes.find(node => node.tagName === "head");
    let allPacks: FaviconReturnPack[] = [];
    FaviconUrlDomCrawlerPaths.forEach((crawlerPath) => {
        allPacks.push(...crawlHeadNodeForFaviconUrls(headNode, crawlerPath));
    });
    if (!allPacks || !allPacks.length) return "";
    let bestPack: FaviconReturnPack;
    let bestArea = 0;
    allPacks.forEach((pack) => {
        if (pack.area > bestArea) {
            bestPack = pack;
            bestArea = pack.area;
        }
    })

    return bestPack.url;
}

function crawlHeadNodeForFaviconUrls(headNode, crawlerPath) {
    let returnPacks: FaviconReturnPack[] = [];
    const faviconNodes = headNode.childNodes.filter(node => {
        if (node.tagName !== crawlerPath.nodeTagName) {
            return false;
        }


        const attr = node.attrs.find(attr => {
            return attr.name === crawlerPath.faviconAttrName
                && attr.value === crawlerPath.faviconAttrValue;
        })

        return attr !== undefined;
    });

    faviconNodes.forEach(element => {
        let innerPack: FaviconReturnPack = {
            url: "",
            area: 2500 // assume 50x50 unless otherwise specified
        }
        if (element.attrs){
            element.attrs.forEach(attr => {
                if (attr.name == 'sizes'){
                    innerPack.area = attr.value.split("x").reduce((acc, val) => {
                        return acc * val;
                    })
                }
                if (attr.name == crawlerPath.urlAttrName){
                    innerPack.url = attr.value;
                }
            });
        }
        returnPacks.push(innerPack);
    });

    return returnPacks;

    // let faviconNode = faviconNodes[0];

    // if (faviconNode === undefined) {
    //     return null;
    // }

    // const urlAttr = faviconNode.attrs.find(attr => attr.name === crawlerPath.urlAttrName);
    // return urlAttr.value;
}

class FaviconCrawlPath {
    nodeTagName: any;
    faviconAttrName: any;
    faviconAttrValue: any;
    urlAttrName: any;
    constructor(nodeTagName, faviconAttrName, faviconAttrValue, urlAttrName) {
        this.nodeTagName = nodeTagName;
        this.faviconAttrName = faviconAttrName;
        this.faviconAttrValue = faviconAttrValue;
        this.urlAttrName = urlAttrName;
    }
}

const FaviconUrlDomCrawlerPaths = [
    new FaviconCrawlPath("meta", "name", "twitter:\\:image", "content"),
    new FaviconCrawlPath("meta", "property", "og\\:image", "content"),
    new FaviconCrawlPath("link", "rel", "apple-touch-icon", "href"),
    new FaviconCrawlPath("link", "rel", "apple-touch-icon-precomposed", "href"),
    new FaviconCrawlPath("meta", "name", "msapplication-TileImage", "content"),
    new FaviconCrawlPath("link", "rel", "icon", "href"),
    new FaviconCrawlPath("link", "rel", "shortcut icon", "href"),
];
