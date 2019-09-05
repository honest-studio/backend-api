// Stolen from https://raw.githubusercontent.com/yfermin/favicon-fetcher/master/src/favicon-fetcher.js
const axios = require('axios');
const parse5 = require('parse5');
const url = require('url');
const checkLinks = require('check-links')

export interface FaviconReturnPack {
    url: string;
    area: number;
}

export function fetchUrl(siteUrl, timeout?: number) {
    return new Promise((resolve, reject) => {
        axios.get(siteUrl)
        .then(response => {
            const html = response.data;
            const faviconUrl = crawlHTMLForFaviconUrl(html);
            let resultURL = resolveFaviconUrl(siteUrl, faviconUrl);
            return checkLinks([resultURL], {
                timeout: timeout ? timeout : 1500,
                retry: 0
            })
        })
        .then(linkStatus => {
            let favURL = Object.keys(linkStatus)[0];
            let linkCheckResult: any = linkStatus[favURL];
            switch(linkCheckResult.status){
                case 'alive':
                    return resolve(favURL);
                case 'dead':
                    return reject("")
                case 'invalid':
                    return reject("")
                default:
                    return reject("")
            }
        })
        .catch(rej => {
            // console.log(rej);
            // console.log("Axios failed in fetch-favicon");
            resolve("");
        });
    });
}

function resolveFaviconUrl(siteUrl, faviconUrl) {
    const parsedSiteUrl = url.parse(siteUrl);
    if (faviconUrl !== null) {
        const parsedFaviconUrl = url.parse(faviconUrl);
        // console.log(parsedSiteUrl)
        // console.log(parsedFaviconUrl)
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
            return `${parsedSiteUrl.protocol}//${parsedSiteUrl.host}/${parsedFaviconUrl.path}`;
        }
    }
    return "";
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
